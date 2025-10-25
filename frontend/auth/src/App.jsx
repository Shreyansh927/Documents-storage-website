import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./components/sign-up/Signup.jsx";
import Login from "./components/login/Login.jsx";
import Home from "./components/home/Home.jsx";
import ChangePassword from "./components/change-password/changePassword.jsx";
import VerifyEmail from "./components/verify-email-for-changing-password.jsx";
import ProtectedRoute from "./components/protectedRoute.jsx";
import EditProfile from "./components/edit-profile/editProfile.jsx";
import Document from "./components/documents/document.jsx";
import UploadDocuments from "./components/upload-documents/uploadDocuments.jsx";
import LockDocuments from "./components/lock-documents/lock-documents.jsx";
import DocumentPassword from "./components/verify-document-pasword/document-password.jsx";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route
          path="/document/:encryptedLink/:cryptoSecretKey/:documentName"
          element={<Document />}
        />
        <Route path="/upload-documents" element={<UploadDocuments />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/verify-user-email" element={<VerifyEmail />} />
        <Route path="/lock-documents/:fileName" element={<LockDocuments />} />
        <Route
          path="/verify-document-password"
          element={<DocumentPassword />}
        />
      </Routes>
    </Router>
  );
};

export default App;
