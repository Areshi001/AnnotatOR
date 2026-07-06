import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Square, Pentagon, Trash2, Save, ZoomIn, ZoomOut } from 'lucide-react';
import { Stage, Layer, Rect, Line, Image as KonvaImage, Text } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import { Annotation, LabelClass, ProjectImage } from '@/types';
import { storage } from '@/lib/storage';

type DrawMode = 'bbox' | 'polygon' | 'select';

const AnnotationEditor = () => {
  const { id, imageId } = useParams<{ id: string; imageId: string }>();
  const [image, setImage] = useState<ProjectImage | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [labelClasses, setLabelClasses] = useState<LabelClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<LabelClass | null>(null);
  const [drawMode, setDrawMode] = useState<DrawMode>('bbox');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scale, setScale] = useState(1);
  const [imageSize, setImageSize] = useState({ width: 800, height: 600 });
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<{ x: number; y: number }[]>([]);

  const loadData = useCallback(async () => {
    if (!id || !imageId) return;

    try {
      const [images, classes, anns] = await Promise.all([
        storage.listImages(id),
        storage.listClasses(id),
        storage.listAnnotations(imageId),
      ]);

      const currentImage = images.find((item) => item.id === imageId) || null;
      setImage(currentImage);
      setLabelClasses(classes || []);
      setAnnotations(anns || []);

      if (classes.length > 0) {
        setSelectedClass(classes[0]);
      }

      if (!currentImage) throw new Error('Image not found');
      const publicUrl = currentImage.storageUrl;
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        setImageObj(img);
        setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
        // Auto-scale to fit
        const container = document.getElementById('canvas-container');
        if (container) {
          const scaleX = (container.clientWidth - 40) / img.naturalWidth;
          const scaleY = (container.clientHeight - 40) / img.naturalHeight;
          setScale(Math.min(scaleX, scaleY, 1));
        }
      };
      img.src = publicUrl;
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [id, imageId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleMouseDown = (e: KonvaEventObject<MouseEvent>) => {
    if (!selectedClass) return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const relPos = { x: (pos.x) / scale, y: (pos.y) / scale };

    if (drawMode === 'bbox') {
      setIsDrawing(true);
      setStartPos(relPos);
      setCurrentRect({ x: relPos.x, y: relPos.y, width: 0, height: 0 });
    } else if (drawMode === 'polygon') {
      setPolygonPoints([...polygonPoints, relPos]);
    }
  };

  const handleMouseMove = (e: KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || drawMode !== 'bbox') return;
    const stage = e.target.getStage();
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) return;
    const relPos = { x: pos.x / scale, y: pos.y / scale };

    setCurrentRect({
      x: Math.min(startPos.x, relPos.x),
      y: Math.min(startPos.y, relPos.y),
      width: Math.abs(relPos.x - startPos.x),
      height: Math.abs(relPos.y - startPos.y),
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || drawMode !== 'bbox' || !currentRect || !selectedClass) return;
    setIsDrawing(false);

    if (currentRect.width > 5 && currentRect.height > 5) {
      const newAnnotation: Annotation = {
        id: `temp-${Date.now()}`,
        projectId: id!,
        imageId: imageId!,
        type: 'bbox',
        classId: selectedClass.id,
        className: selectedClass.name,
        color: selectedClass.color,
        x: currentRect.x,
        y: currentRect.y,
        width: currentRect.width,
        height: currentRect.height,
        createdAt: new Date().toISOString(),
      };
      setAnnotations([...annotations, newAnnotation]);
    }
    setCurrentRect(null);
  };

  const finishPolygon = useCallback(() => {
    if (polygonPoints.length < 3 || !selectedClass) return;

    const newAnnotation: Annotation = {
      id: `temp-${Date.now()}`,
      projectId: id!,
      imageId: imageId!,
      type: 'polygon',
      classId: selectedClass.id,
      className: selectedClass.name,
      color: selectedClass.color,
      points: [...polygonPoints],
      createdAt: new Date().toISOString(),
    };
    setAnnotations([...annotations, newAnnotation]);
    setPolygonPoints([]);
  }, [annotations, id, imageId, polygonPoints, selectedClass]);

  const deleteAnnotation = (annId: string) => {
    setAnnotations(annotations.filter(a => a.id !== annId));
  };

  const saveAnnotations = async () => {
    setSaving(true);
    try {
      const newAnnotations = annotations.filter(a => a.id.startsWith('temp-'));
      if (newAnnotations.length > 0) {
        await storage.saveAnnotations(imageId!, newAnnotations);
      }

      await loadData();
    } catch (err) {
      console.error('Error saving annotations:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setPolygonPoints([]);
      setIsDrawing(false);
      setCurrentRect(null);
    }
    if (e.key === 'Enter' && drawMode === 'polygon') {
      finishPolygon();
    }
  }, [drawMode, finishPolygon]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>;
  }

  const newAnnotations = annotations.filter(a => a.id.startsWith('temp-'));

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <Link to={`/project/${id}/dataset`} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Dataset
          </Link>
          <span className="text-gray-500">|</span>
          <span className="text-white font-medium text-sm">{image?.fileName}</span>
          <span className="text-gray-500 text-xs">{imageSize.width} x {imageSize.height}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Draw mode buttons */}
          <div className="flex bg-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => { setDrawMode('bbox'); setPolygonPoints([]); }}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm ${drawMode === 'bbox' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
              title="Bounding Box (B)"
            >
              <Square className="w-4 h-4" />
              BBox
            </button>
            <button
              onClick={() => { setDrawMode('polygon'); setIsDrawing(false); setCurrentRect(null); }}
              className={`flex items-center gap-1 px-3 py-1.5 text-sm ${drawMode === 'polygon' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
              title="Polygon (P)"
            >
              <Pentagon className="w-4 h-4" />
              Polygon
            </button>
          </div>

          <span className="text-gray-500">|</span>

          {/* Zoom */}
          <button onClick={() => setScale(s => Math.max(0.1, s - 0.1))} className="p-1.5 text-gray-400 hover:text-white">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-gray-400 text-xs w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-1.5 text-gray-400 hover:text-white">
            <ZoomIn className="w-4 h-4" />
          </button>

          <span className="text-gray-500">|</span>

          <button
            onClick={saveAnnotations}
            disabled={saving || newAnnotations.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save ({newAnnotations.length})
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 bg-gray-900 overflow-auto flex items-center justify-center" id="canvas-container">
          {imageObj && (
            <Stage
              width={imageSize.width * scale}
              height={imageSize.height * scale}
              scaleX={scale}
              scaleY={scale}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              style={{ cursor: drawMode === 'select' ? 'default' : 'crosshair' }}
            >
              <Layer>
                {/* Background image */}
                <KonvaImage image={imageObj} width={imageSize.width} height={imageSize.height} />

                {/* Saved annotations */}
                {annotations.map((ann) => {
                  if (ann.type === 'bbox' && ann.width && ann.height) {
                    return (
                      <Rect
                        key={ann.id}
                        x={ann.x}
                        y={ann.y}
                        width={ann.width}
                        height={ann.height}
                        stroke={ann.color}
                        strokeWidth={2 / scale}
                        fill={ann.color + '20'}
                      />
                    );
                  }
                  if (ann.type === 'polygon' && ann.points && ann.points.length > 2) {
                    const flatPoints = ann.points.flatMap(p => [p.x, p.y]);
                    return (
                      <Line
                        key={ann.id}
                        points={flatPoints}
                        closed
                        stroke={ann.color}
                        strokeWidth={2 / scale}
                        fill={ann.color + '20'}
                      />
                    );
                  }
                  return null;
                })}

                {/* Annotation labels */}
                {annotations.map((ann) => {
                  const labelX = ann.type === 'bbox' ? (ann.x || 0) : (ann.points?.[0]?.x || 0);
                  const labelY = ann.type === 'bbox' ? ((ann.y || 0) - 18 / scale) : ((ann.points?.[0]?.y || 0) - 18 / scale);
                  return (
                    <Text
                      key={`label-${ann.id}`}
                      x={labelX}
                      y={labelY}
                      text={ann.className}
                      fontSize={14 / scale}
                      fill={ann.color}
                      fontStyle="bold"
                      padding={2 / scale}
                    />
                  );
                })}

                {/* Current drawing rect */}
                {currentRect && isDrawing && (
                  <Rect
                    x={currentRect.x}
                    y={currentRect.y}
                    width={currentRect.width}
                    height={currentRect.height}
                    stroke={selectedClass?.color || '#3B82F6'}
                    strokeWidth={2 / scale}
                    dash={[6 / scale, 4 / scale]}
                    fill={(selectedClass?.color || '#3B82F6') + '15'}
                  />
                )}

                {/* Current polygon points */}
                {polygonPoints.length > 0 && (
                  <>
                    <Line
                      points={polygonPoints.flatMap(p => [p.x, p.y])}
                      stroke={selectedClass?.color || '#3B82F6'}
                      strokeWidth={2 / scale}
                      dash={[6 / scale, 4 / scale]}
                      fill={(selectedClass?.color || '#3B82F6') + '15'}
                    />
                    {polygonPoints.map((p, i) => (
                      <Rect
                        key={`point-${i}`}
                        x={p.x - 3 / scale}
                        y={p.y - 3 / scale}
                        width={6 / scale}
                        height={6 / scale}
                        fill={selectedClass?.color || '#3B82F6'}
                      />
                    ))}
                  </>
                )}
              </Layer>
            </Stage>
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-72 bg-gray-800 border-l border-gray-700 flex flex-col overflow-hidden">
          {/* Class selector */}
          <div className="p-4 border-b border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Active Class</h3>
            {labelClasses.length === 0 ? (
              <p className="text-xs text-gray-500">No classes. Add some first.</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {labelClasses.map((cls) => (
                  <button
                    key={cls.id}
                    onClick={() => setSelectedClass(cls)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                      selectedClass?.id === cls.id ? 'bg-gray-700 ring-1 ring-blue-500' : 'hover:bg-gray-700/50'
                    }`}
                  >
                    <div className="w-3 h-3 rounded flex-shrink-0" style={{ backgroundColor: cls.color }} />
                    <span className="text-white truncate">{cls.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Annotations list */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-300">Annotations</h3>
              <span className="text-xs text-gray-500">{annotations.length} total</span>
            </div>

            {annotations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-gray-500 mb-1">No annotations yet</p>
                <p className="text-xs text-gray-600">
                  {drawMode === 'bbox' ? 'Click and drag to draw a box' : 'Click to add points, Enter to finish'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {annotations.map((ann) => (
                  <div
                    key={ann.id}
                    className={`flex items-center justify-between px-3 py-2 rounded text-sm ${
                      ann.id.startsWith('temp-') ? 'bg-yellow-900/20 border border-yellow-800/30' : 'bg-gray-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ann.color }} />
                      <span className="text-white text-xs">{ann.className}</span>
                      <span className="text-gray-500 text-xs">({ann.type})</span>
                    </div>
                    <button
                      onClick={() => deleteAnnotation(ann.id)}
                      className="p-1 hover:bg-red-600/20 rounded text-gray-500 hover:text-red-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Help */}
          <div className="p-4 border-t border-gray-700">
            <div className="text-xs text-gray-500 space-y-1">
              {drawMode === 'bbox' ? (
                <p>Click + drag to draw bbox</p>
              ) : (
                <>
                  <p>Click to add points</p>
                  <p>Enter to finish polygon</p>
                </>
              )}
              <p>Esc to cancel</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnotationEditor;
