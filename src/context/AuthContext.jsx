import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../database/supabaseconfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [permisos, setPermisos] = useState({});
  const [cargando, setCargando] = useState(true);

  const cargarPermisos = async (rol) => {
    if (!rol) return;

    const { data, error } = await supabase
      .from('permisos')
      .select('permisos')
      .eq('rol', rol)
      .single();

      console.log("Permisos cargados para rol:", rol, data);

    if (error) {
      console.error("Error al cargar permisos:", error);
      return;
    }

    setPermisos(data?.permisos || {});
  };

  const login = async (email, password) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;

    // Obtener rol del empleado
    const { data: empleado, error: empError } = await supabase
      .from('empleados')
      .select('tipo_empleado')
      .eq('email', email)
      .single();

    if (empError || !empleado) {
      console.error("Error obteniendo empleado:", empError);
      throw new Error("No se encontró información del empleado");
    }

    localStorage.setItem("usuario-supabase", email);
    
    setUsuario({
      email: email,
      rol: empleado.tipo_empleado
    });

    await cargarPermisos(empleado.tipo_empleado);
    return authData;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("usuario-supabase");
    setUsuario(null);
    setPermisos({});
  };

  // Cargar sesión al iniciar
  useEffect(() => {
    const cargarSesionInicial = async () => {
      const usuarioGuardado = localStorage.getItem("usuario-supabase");
      
      if (usuarioGuardado) {
        try {
          const { data: empleado, error } = await supabase
            .from('empleados')
            .select('tipo_empleado')
            .eq('email', usuarioGuardado)
            .single();

          if (empleado && !error) {
            setUsuario({
              email: usuarioGuardado,
              rol: empleado.tipo_empleado
            });
            await cargarPermisos(empleado.tipo_empleado);
          } else {
            // Si no se puede obtener el empleado, limpiar sesión
            localStorage.removeItem("usuario-supabase");
          }
        } catch (err) {
          console.error("Error al recuperar sesión:", err);
          localStorage.removeItem("usuario-supabase");
        }
      }
      setCargando(false);
    };

    cargarSesionInicial();
  }, []);

  const tienePermiso = (permiso) => !!permisos[permiso];

  return (
    <AuthContext.Provider value={{
      usuario,
      permisos,
      tienePermiso,
      login,
      logout,
      cargando
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};