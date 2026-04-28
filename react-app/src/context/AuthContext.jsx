import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const refreshUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (!error && user) {
      setUser(user);
    }
  };

  const updateUserState = (newUser) => {
    if (newUser) setUser(newUser);
  };

  const value = {
    session,
    user,
    refreshUser,
    updateUserState,
    signOut: async () => {
      // Clear tutorial session flags so the tour shows again on next login
      sessionStorage.removeItem('tutorial_done');
      sessionStorage.removeItem('tutorial_active');
      sessionStorage.removeItem('tutorial_next_page');

      // Clear any legacy localStorage tutorial keys from older versions
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('tutorial_completed_') || key.startsWith('tutorial_done_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
      localStorage.removeItem('dashboard_tutorial_completed');

      await supabase.auth.signOut();
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
