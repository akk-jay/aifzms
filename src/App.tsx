import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Settings from "@/pages/Settings";
import Records from "@/pages/Records";
import Help from "@/pages/Help";
import { Toaster } from "@/components/ui/toast";

function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/records" element={<Records />} />
          <Route path="/help" element={<Help />} />
        </Routes>
      </Layout>
      <Toaster />
    </HashRouter>
  );
}

export default App;
