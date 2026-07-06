import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProjectList from '@/pages/ProjectList';
import ProjectDashboard from '@/pages/ProjectDashboard';
import DatasetView from '@/pages/DatasetView';
import AnnotationEditor from '@/pages/AnnotationEditor';
import ClassManager from '@/pages/ClassManager';
import WorkflowBuilder from '@/pages/WorkflowBuilder';
import UniverseHome from '@/pages/UniverseHome';
import DatasetDetail from '@/pages/DatasetDetail';
import UploadDataset from '@/pages/UploadDataset';
import NotFound from '@/pages/NotFound';
import StorageSetup from '@/pages/StorageSetup';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <ProjectList />
            </Layout>
          }
        />
        <Route
          path="/project/:id"
          element={
            <Layout>
              <ProjectDashboard />
            </Layout>
          }
        />
        <Route
          path="/project/:id/dataset"
          element={
            <Layout>
              <DatasetView />
            </Layout>
          }
        />
        <Route
          path="/project/:id/annotate/:imageId"
          element={
            <Layout>
              <AnnotationEditor />
            </Layout>
          }
        />
        <Route
          path="/project/:id/classes"
          element={
            <Layout>
              <ClassManager />
            </Layout>
          }
        />
        <Route
          path="/project/:id/workflow"
          element={
            <Layout>
              <WorkflowBuilder />
            </Layout>
          }
        />
        <Route
          path="/universe"
          element={
            <Layout>
              <UniverseHome />
            </Layout>
          }
        />
        <Route
          path="/universe/:datasetId"
          element={
            <Layout>
              <DatasetDetail />
            </Layout>
          }
        />
        <Route
          path="/universe/upload"
          element={
            <Layout>
              <UploadDataset />
            </Layout>
          }
        />
        <Route
          path="/setup"
          element={
            <Layout>
              <StorageSetup />
            </Layout>
          }
        />
        <Route
          path="*"
          element={
            <Layout>
              <NotFound />
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
