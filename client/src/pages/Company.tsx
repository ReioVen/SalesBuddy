import React from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useTranslation } from '../hooks/useTranslation.ts';
import CompanyManagement from '../components/CompanyManagement.tsx';

const Company: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();

  // If user doesn't have a company, show message instead of redirect
  if (!user?.companyId) {
    return <div className="p-4">{t('noCompanyAssociated')}</div>;
  }

  // If user has a company, show company management
  return <CompanyManagement />;
};

export default Company;
