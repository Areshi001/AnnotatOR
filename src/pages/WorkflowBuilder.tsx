import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ReactFlow,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ArrowLeft, Save, Database, Cpu, Shuffle, Download } from 'lucide-react';
import { type Workflow } from '@/types';
import { storage } from '@/lib/storage';

const NODE_TYPES = {
  loadDataset: { label: 'Load Dataset', icon: Database, color: 'border-blue-500', bg: 'bg-blue-900/30' },
  preprocess: { label: 'Preprocess', icon: Cpu, color: 'border-yellow-500', bg: 'bg-yellow-900/30' },
  augment: { label: 'Augment', icon: Shuffle, color: 'border-purple-500', bg: 'bg-purple-900/30' },
  export: { label: 'Export', icon: Download, color: 'border-green-500', bg: 'bg-green-900/30' },
};

type NodeType = keyof typeof NODE_TYPES;
type WorkflowNodeData = { label?: string; description?: string };
type WorkflowNode = Node<WorkflowNodeData, NodeType>;
type WorkflowEdge = Edge;

const CustomNode = ({ data, type }: NodeProps<WorkflowNode>) => {
  const config = NODE_TYPES[(type ?? 'loadDataset') as NodeType] || NODE_TYPES.loadDataset;
  const Icon = config.icon;

  return (
    <div className={`px-4 py-3 rounded-lg border-2 ${config.color} ${config.bg} min-w-[160px]`}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-gray-400" />
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-white" />
        <span className="text-white font-medium text-sm">{data.label || config.label}</span>
      </div>
      {data.description && <p className="text-xs text-gray-400 mt-1">{data.description}</p>}
      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-gray-400" />
    </div>
  );
};

const nodeTypes = {
  loadDataset: CustomNode,
  preprocess: CustomNode,
  augment: CustomNode,
  export: CustomNode,
};

const WorkflowBuilder = () => {
  const { id } = useParams<{ id: string }>();
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowEdge>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workflowId, setWorkflowId] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState('Untitled Workflow');

  const loadWorkflow = useCallback(async () => {
    if (!id) return;
    try {
      const data = await storage.getWorkflow(id);
      if (data) {
        setWorkflowId(data.id);
        setWorkflowName(data.name);
        setNodes((data.nodes || []).map((node) => ({ ...node, data: node.data || {} })) as WorkflowNode[]);
        setEdges(data.edges || []);
      }
    } catch (err) {
      console.error('Error loading workflow:', err);
    } finally {
      setLoading(false);
    }
  }, [id, setEdges, setNodes]);

  useEffect(() => {
    void loadWorkflow();
  }, [loadWorkflow]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;
      const edge: WorkflowEdge = {
        id: `${params.source}-${params.sourceHandle ?? 'source'}-${params.target}-${params.targetHandle ?? 'target'}`,
        source: params.source,
        target: params.target,
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        animated: true,
        style: { stroke: '#6B7280' },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges],
  );

  const addNode = (type: NodeType) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      position: { x: 250 + Math.random() * 100, y: 100 + nodes.length * 120 },
      data: { label: NODE_TYPES[type].label },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const saveWorkflow = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const payload: Workflow = {
        id: workflowId || `wf-${Date.now()}`,
        projectId: id,
        name: workflowName,
        nodes: nodes.map((node) => ({ id: node.id, type: node.type, position: node.position, data: node.data })),
        edges: edges.map((edge) => ({ id: edge.id, source: edge.source, target: edge.target })),
        updatedAt: new Date().toISOString(),
      };
      await storage.saveWorkflow(id, payload);
      setWorkflowId(payload.id);
    } catch (err) {
      console.error('Error saving workflow:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <Link to={`/project/${id}`} className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm">
            <ArrowLeft className="w-4 h-4" />
            Project
          </Link>
          <span className="text-gray-500">|</span>
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="bg-transparent text-white font-medium text-sm border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-2 py-1"
          />
        </div>

        <div className="flex items-center gap-2">
          {(Object.keys(NODE_TYPES) as NodeType[]).map((type) => {
            const config = NODE_TYPES[type];
            const Icon = config.icon;
            return (
              <button
                key={type}
                onClick={() => addNode(type)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm border ${config.color} ${config.bg} text-white hover:opacity-80 transition-opacity`}
              >
                <Icon className="w-3.5 h-3.5" />
                {config.label}
              </button>
            );
          })}
          <span className="text-gray-500">|</span>
          <button
            onClick={saveWorkflow}
            disabled={saving}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>

      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gray-900"
        >
          <Background color="#374151" gap={20} />
          <Controls className="!bg-gray-800 !border-gray-700 [&>button]:!bg-gray-800 [&>button]:!border-gray-700 [&>button]:!text-white" />
        </ReactFlow>
      </div>
    </div>
  );
};

export default WorkflowBuilder;
