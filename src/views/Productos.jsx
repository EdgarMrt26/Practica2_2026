import React, { useState, useEffect } from "react";
import { supabase } from "../database/supabaseconfig";
import { Container, Row, Col, Button, Spinner, Alert } from "react-bootstrap";
import ModalRegistroProducto from "../components/productos/ModalRegistroProducto";
import ModalEdicionProducto from "../components/productos/ModalEdicionProducto";
import ModalEliminacionProducto from "../components/productos/ModalEliminacionProducto";
import TablaProductos from "../components/productos/TablaProductos";
import TarjetaProducto from "../components/productos/TarjetaProducto";
import NotificacionOperacion from "../components/NotificacionOperacion";
import CuadroBusquedas from "../components/busquedas/CuadroBusquedas";
import Paginacion from "../components/ordenamiento/Paginacion";
import ModalQRProducto from "../components/productos/ModalQRProducto";

const Productos = () => {
  const [toast, setToast] = useState({ mostrar: false, mensaje: "", tipo: "" });
  const [mostrarModal, setMostrarModal] = useState(false);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModalEliminacion, setMostrarModalEliminacion] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);

  const [productoEditar, setProductoEditar] = useState({
    id_producto: "",
    nombre_producto: "",
    descripcion_producto: "",
    categoria_producto: "",
    precio_venta: "",
    url_imagen: "",
    nuevaImagen: null,        // ← Agregado para edición
  });

  // Estados para categorías (necesario para los select de los modales)
  const [categorias, setCategorias] = useState([]);



  const cargarProductos = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .order("id_producto", { ascending: true });

      if (error) {
        console.error("Error al cargar productos:", error.message);
        setToast({
          mostrar: true,
          mensaje: "Error al cargar productos.",
          tipo: "error",
        });
        return;
      }
      setProductos(data || []);
    } catch (err) {
      console.error("Excepción al cargar productos:", err.message);
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al cargar productos",
        tipo: "error",
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarCategorias = async () => {
    const { data } = await supabase
      .from("categorias")
      .select("id_categoria, nombre_categoria")
      .order("nombre_categoria");

    setCategorias(data || []);
  };

  useEffect(() => {
    cargarProductos();
    cargarCategorias();
  }, []);

  // ==================== MODALES ====================

  const abrirModalEdicion = (producto) => {
    setProductoEditar({
      id_producto: producto.id_producto,
      nombre_producto: producto.nombre_producto,
      descripcion_producto: producto.descripcion_producto || "",
      categoria_producto: producto.categoria_producto,
      precio_venta: producto.precio_venta,
      url_imagen: producto.url_imagen || "",
      nuevaImagen: null,
    });
    setMostrarModalEdicion(true);
  };

  const abrirModalEliminacion = (producto) => {
    setProductoAEliminar(producto);
    setMostrarModalEliminacion(true);
  };

  // ==================== ESTADO PARA NUEVO PRODUCTO ====================

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre_producto: "",
    descripcion_producto: "",
    categoria_producto: "",
    precio_venta: "",
    imagen: null, // para el archivo
  });

  const manejoCambioInput = (e) => {
    const { name, value } = e.target;
    setNuevoProducto((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const manejoCambioArchivo = (e) => {
    setNuevoProducto((prev) => ({
      ...prev,
      imagen: e.target.files[0],
    }));
  };

    // ==================== REGISTRAR PRODUCTO CON IMAGEN ====================

  const agregarProducto = async () => {
    try {
      if (
        !nuevoProducto.nombre_producto.trim() ||
        !nuevoProducto.categoria_producto ||
        !nuevoProducto.precio_venta ||
        !nuevoProducto.imagen
      ) {
        setToast({
          mostrar: true,
          mensaje: "Debe llenar los campos obligatorios (*) y seleccionar una imagen.",
          tipo: "advertencia",
        });
        return;
      }

      // 1. Subir imagen al bucket correcto
      const fileExt = nuevoProducto.imagen.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('imagenes_productos')           // ← Nombre correcto de tu bucket
        .upload(fileName, nuevoProducto.imagen, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error("Error al subir imagen:", uploadError);
        setToast({
          mostrar: true,
          mensaje: "Error al subir la imagen.",
          tipo: "error",
        });
        return;
      }

      // 2. Obtener la URL pública
      const { data: urlData } = supabase.storage
        .from('imagenes_productos')
        .getPublicUrl(fileName);

      const urlImagen = urlData.publicUrl;

      // 3. Guardar el producto en la base de datos
      const { error } = await supabase.from("productos").insert([
        {
          nombre_producto: nuevoProducto.nombre_producto.trim(),
          descripcion_producto: nuevoProducto.descripcion_producto?.trim() || "",
          categoria_producto: nuevoProducto.categoria_producto,
          precio_venta: parseFloat(nuevoProducto.precio_venta),
          url_imagen: urlImagen,
        },
      ]);

      if (error) throw error;

      setToast({
        mostrar: true,
        mensaje: `Producto "${nuevoProducto.nombre_producto}" registrado exitosamente.`,
        tipo: "exito",
      });

      await cargarProductos();

      // Resetear formulario
      setNuevoProducto({
        nombre_producto: "",
        descripcion_producto: "",
        categoria_producto: "",
        precio_venta: "",
        imagen: null,
      });
      setMostrarModal(false);

    } catch (err) {
      console.error("Excepción al agregar producto:", err.message);
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al registrar producto.",
        tipo: "error",
      });
    }
  };

  // ==================== EDICIÓN ====================

  const manejoCambioInputEdicion = (e) => {
    const { name, value } = e.target;
    setProductoEditar((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const manejoCambioArchivoActualizar = (e) => {
    setProductoEditar((prev) => ({
      ...prev,
      nuevaImagen: e.target.files[0],
    }));
  };

  const actualizarProducto = async () => {
    try {
      if (
        !productoEditar.nombre_producto.trim() ||
        !productoEditar.categoria_producto ||
        !productoEditar.precio_venta
      ) {
        setToast({
          mostrar: true,
          mensaje: "Debe llenar los campos obligatorios (*).",
          tipo: "advertencia",
        });
        return;
      }

      let urlImagenFinal = productoEditar.url_imagen;

      // Si se seleccionó una nueva imagen
      if (productoEditar.nuevaImagen) {
        const fileExt = productoEditar.nuevaImagen.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('imagenes_productos')           // ← Nombre correcto del bucket
          .upload(fileName, productoEditar.nuevaImagen, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('imagenes_productos')
          .getPublicUrl(fileName);

        urlImagenFinal = urlData.publicUrl;
      }

      const { error } = await supabase
        .from("productos")
        .update({
          nombre_producto: productoEditar.nombre_producto.trim(),
          descripcion_producto: productoEditar.descripcion_producto?.trim() || "",
          categoria_producto: productoEditar.categoria_producto,
          precio_venta: parseFloat(productoEditar.precio_venta),
          url_imagen: urlImagenFinal,
        })
        .eq("id_producto", productoEditar.id_producto);

      if (error) throw error;

      await cargarProductos();
      setMostrarModalEdicion(false);

      setToast({
        mostrar: true,
        mensaje: `Producto ${productoEditar.nombre_producto} actualizado exitosamente.`,
        tipo: "exito",
      });
    } catch (err) {
      console.error("Excepción al actualizar producto:", err.message);
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al actualizar producto.",
        tipo: "error",
      });
    }
  };



  const eliminarProducto = async () => {
    if (!productoAEliminar) return;

    setMostrarModalEliminacion(false);

    try {
      const { error } = await supabase
        .from("productos")
        .delete()
        .eq("id_producto", productoAEliminar.id_producto);

      if (error) {
        console.error("Error al eliminar producto:", error.message);
        setToast({
          mostrar: true,
          mensaje: `Error al eliminar el producto ${productoAEliminar.nombre_producto}.`,
          tipo: "error",
        });
        return;
      }

      await cargarProductos();
      setToast({
        mostrar: true,
        mensaje: `Producto ${productoAEliminar.nombre_producto} eliminado exitosamente.`,
        tipo: "exito",
      });
    } catch (err) {
      setToast({
        mostrar: true,
        mensaje: "Error inesperado al eliminar producto.",
        tipo: "error",
      });
      console.error("Excepción al eliminar producto:", err.message);
    }
  };



  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [productosFiltrados, setProductosFiltrados] = useState([]);

  const manejarBusqueda = (e) => {
    setTextoBusqueda(e.target.value);
  };

  useEffect(() => {
    if (!textoBusqueda.trim()) {
      setProductosFiltrados(productos);
    } else {
      const textoLower = textoBusqueda.toLowerCase().trim();
      const filtradas = productos.filter((prod) =>
        prod.nombre_producto.toLowerCase().includes(textoLower) ||
        (prod.descripcion_producto && prod.descripcion_producto.toLowerCase().includes(textoLower))
      );
      setProductosFiltrados(filtradas);
    }
  }, [textoBusqueda, productos]);

  

  const [registrosPorPagina, establecerRegistrosPorPagina] = useState(5);
  const [paginaActual, establecerPaginaActual] = useState(1);

  const productosPaginados = productosFiltrados.slice(
    (paginaActual - 1) * registrosPorPagina,
    paginaActual * registrosPorPagina
  );

  // ==================== FUNCIÓN COPIAR PRODUCTO ====================
  const copiarProducto = async (producto) => {
    if (!producto) return;

    const texto = `
    ID: ${producto.id_producto}
    Producto: ${producto.nombre_producto}
    Descripción: ${producto.descripcion_producto || 'Sin descripción'}
    Precio: $${producto.precio_venta}
    Categoría: ${producto.categoria_producto || 'Sin categoría'}`;

    try {
      await navigator.clipboard.writeText(texto);

      setToast({
        mostrar: true,
        mensaje: `Producto "${producto.nombre_producto}" copiado al portapapeles`,
        tipo: "exito",
      });
    } catch (err) {
      console.error("Error al copiar:", err);
      setToast({
        mostrar: true,
        mensaje: "No se pudo copiar al portapapeles",
        tipo: "error",
      });
    }
  };

    const [mostrarModalQR, setMostrarModalQR] = useState(false);
    const [productoQR, setProductoQR] = useState(null);

    const generarQRImagen = (producto) => {
      if (!producto?.url_imagen) {
        setToast({
          mostrar: true,
          mensaje: "Este producto no tiene imagen asociada",
          tipo: "advertencia"
        });
        return;
      }

      setProductoQR(producto);
      setMostrarModalQR(true);
    };

    return (
    <Container className="mt-3">
      {/* Título y botón Nuevo Producto */}
      <Row className="align-items-center mb-3">
        <Col xs={9} sm={7} md={7} lg={7} className="d-flex align-items-center">
          <h3 className="mb-0">
            <i className="bi-box-seam me-2"></i> Productos
          </h3>
        </Col>
        <Col xs={3} sm={5} md={5} lg={5} className="text-end">
          <Button onClick={() => setMostrarModal(true)} size="md">
            <i className="bi-plus-lg"></i>
            <span className="d-none d-sm-inline ms-2">Nuevo Producto</span>
          </Button>
        </Col>
      </Row>

      <hr />

      {/* Spinner mientras se cargan los productos */}
      {cargando && (
        <Row className="text-center my-5">
          <Col>
            <Spinner animation="border" variant="success" size="lg" />
            <p className="mt-3 text-muted">Cargando Productos...</p>
          </Col>
        </Row>
      )}

      {/* Cuadro de búsqueda debajo de la línea divisoria */}
      <Row className="mb-4">
        <Col md={6} lg={5}>
          <CuadroBusquedas
            textoBusqueda={textoBusqueda}
            manejarCambioBusqueda={manejarBusqueda}
            placeholder="Buscar por nombre o descripción..."
          />
        </Col>
      </Row>

      {/* Mensaje de no coincidencias solo cuando hay búsqueda y no hay resultado */}
      {!cargando && textoBusqueda.trim() && productosFiltrados.length === 0 && (
        <Row className="mb-4">
          <Col>
            <Alert variant="info" className="text-center">
              <i className="bi bi-info-circle me-2"></i>
              No se encontraron productos que coincidan con "{textoBusqueda}"
            </Alert>
          </Col>
        </Row>
      )}

      {/* Lista de productos filtrados (Tarjetas en móvil + Tabla en desktop) */}
      {!cargando && productosFiltrados.length > 0 && (
        <Row>
          <Col xs={12} sm={12} md={12} className="d-lg-none">
            <TarjetaProducto
              productos={productosPaginados}
              categorias={categorias}
              abrirModalEdicion={abrirModalEdicion}
              abrirModalEliminacion={abrirModalEliminacion}
              copiarProducto={copiarProducto}
              generarQRImagen={generarQRImagen}
            />
          </Col>
          <Col lg={12} className="d-none d-lg-block">
            <TablaProductos
              productos={productosPaginados}
              categorias={categorias}
              abrirModalEdicion={abrirModalEdicion}
              abrirModalEliminacion={abrirModalEliminacion}
              copiarProducto={copiarProducto}
              generarQRImagen={generarQRImagen}
            />
          </Col>
        </Row>
      )}

      {/* Modales */}

      <ModalRegistroProducto
        mostrarModal={mostrarModal}
        setMostrarModal={setMostrarModal}
        nuevoProducto={nuevoProducto}
        manejoCambioInput={manejoCambioInput}
        manejoCambioArchivo={manejoCambioArchivo}
        agregarProducto={agregarProducto}
        categorias={categorias}
      />

      <ModalEdicionProducto
        mostrarModalEdicion={mostrarModalEdicion}
        setMostrarModalEdicion={setMostrarModalEdicion}
        productoEditar={productoEditar}
        manejoCambioInputEdicion={manejoCambioInputEdicion}
        manejoCambioArchivoActualizar={manejoCambioArchivoActualizar}
        actualizarProducto={actualizarProducto}
        categorias={categorias}
      />

      <ModalEliminacionProducto
        mostrarModalEliminacion={mostrarModalEliminacion}
        setMostrarModalEliminacion={setMostrarModalEliminacion}
        eliminarProducto={eliminarProducto}
        producto={productoAEliminar}
      />

      <ModalQRProducto
        mostrar={mostrarModalQR}
        onHide={() => setMostrarModalQR(false)}
        producto={productoQR}
      />

      {/* Paginación */}
      {productosFiltrados.length > 0 && (
        <Paginacion
          registrosPorPagina={registrosPorPagina}
          totalRegistros={productosFiltrados.length}
          paginaActual={paginaActual}
          establecerPaginaActual={establecerPaginaActual}
          establecerRegistrosPorPagina={establecerRegistrosPorPagina}
        />
      )}

      {/* Notificación */}
      <NotificacionOperacion
        mostrar={toast.mostrar}
        mensaje={toast.mensaje}
        tipo={toast.tipo}
        onCerrar={() => setToast({ ...toast, mostrar: false })}
      />
    </Container>
  );
};

export default Productos;