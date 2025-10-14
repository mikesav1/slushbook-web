// Session management for anonymous users
export const getSessionId = () => {
  let sessionId = localStorage.getItem('slushfinder_session_id');
  
  if (!sessionId) {
    sessionId = generateUUID();
    localStorage.setItem('slushfinder_session_id', sessionId);
  }
  
  return sessionId;
};

export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const clearSession = () => {
  localStorage.removeItem('slushfinder_session_id');
};
