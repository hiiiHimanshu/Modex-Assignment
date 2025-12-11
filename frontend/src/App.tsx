import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Layout } from "./components/Layout";
import { AdminPage } from "./pages/AdminPage";
import { BookingPage } from "./pages/BookingPage";
import { HomePage } from "./pages/HomePage";

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12, scale: 0.98 },
};

const PageShell = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={{ duration: 0.28, ease: "easeOut" }}
  >
    {children}
  </motion.div>
);

function App() {
  const location = useLocation();

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <PageShell>
                <HomePage />
              </PageShell>
            }
          />
          <Route
            path="/admin"
            element={
              <PageShell>
                <AdminPage />
              </PageShell>
            }
          />
          <Route
            path="/booking/:id"
            element={
              <PageShell>
                <BookingPage />
              </PageShell>
            }
          />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}

export default App;
