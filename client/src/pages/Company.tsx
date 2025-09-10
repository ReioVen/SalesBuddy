import React from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { Navigate } from 'react-router-dom';
import CompanyManagement from '../components/CompanyManagement.tsx';

const Company: React.FC = () => {
  const { user } = useAuth();

  // If user doesn't have a company, redirect to admin panel
  if (!user?.companyId) {
    return <Navigate to="/admin" replace />;
  }

  // If user has a company, show company management
  return <CompanyManagement />;
};

export default Company;
