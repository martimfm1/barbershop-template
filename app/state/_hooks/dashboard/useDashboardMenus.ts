import { useState, useCallback } from "react";

export function useDashboardMenus() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddBlockForm, setShowAddBlockForm] = useState(false);
  const [showProfessionalsList, setShowProfessionalsList] = useState(false);
  const [showClientsList, setShowClientsList] = useState(false);
  const [showServicesList, setShowServicesList] = useState(false);
  const [showManualMessageForm, setShowManualMessageForm] = useState(false);

  const closeAllMenus = useCallback(() => {
    setShowAddForm(false);
    setShowAddBlockForm(false);
    setShowProfessionalsList(false);
    setShowClientsList(false);
    setShowServicesList(false);
    setShowManualMessageForm(false);
  }, []);

  return {
    showAddForm,
    setShowAddForm,
    showAddBlockForm,
    setShowAddBlockForm,
    showProfessionalsList,
    setShowProfessionalsList,
    showClientsList,
    setShowClientsList,
    showServicesList,
    setShowServicesList,
    showManualMessageForm,
    setShowManualMessageForm,
    closeAllMenus,
  };
}