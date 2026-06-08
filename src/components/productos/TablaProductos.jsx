import React, { useState, useEffect } from "react";
import { Table, Spinner, Button, Image } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const TablaProductos = ({
  productos,
  abrirModalEdicion,
  abrirModalEliminacion,
  categorias,           
  copiarProducto,
  generarQRImagen  
}) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (productos && productos.length > 0) {
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [productos]);

  // Función auxiliar para obtener el nombre de la categoría
  const obtenerNombreCategoria = (idCategoria) => {
    if (!categorias || !idCategoria) return "Sin categoría";
    const categoria = categorias.find(cat => cat.id_categoria === idCategoria);
    return categoria ? categoria.nombre_categoria : "Sin categoría";
  };

  return (
    <>
      {loading ? (
        <div className="text-center">
          <h4>Cargando productos...</h4>
          <Spinner animation="border" variant="success" role="status" />
        </div>
      ) : (
        <Table striped bordered hover responsive size="sm">
          <thead>
            <tr>
              <th className="text-center">ID</th>
              <th>Imagen</th>
              <th>Nombre</th>
              <th className="d-none d-lg-table-cell">Descripción</th>
              <th className="d-none d-md-table-cell">Categoría</th>
              <th className="text-end">Precio</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.map((producto) => (
              <tr key={producto.id_producto}>
                <td className="text-center">{producto.id_producto}</td>

                {/* Imagen del producto */}
                <td className="text-center">
                  {producto.url_imagen ? (
                    <Image
                      src={producto.url_imagen}
                      alt={producto.nombre_producto}
                      rounded
                      style={{
                        width: "50px",
                        height: "50px",
                        objectFit: "cover",
                        border: "1px solid #ddd"
                      }}
                    />
                  ) : (
                    <div 
                      style={{
                        width: "50px",
                        height: "50px",
                        backgroundColor: "#f0f0f0",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <i className="bi bi-image text-muted"></i>
                    </div>
                  )}
                </td>

                <td>{producto.nombre_producto}</td>

                <td className="d-none d-lg-table-cell text-truncate" style={{ maxWidth: "250px" }}>
                  {producto.descripcion_producto || <span className="text-muted">Sin descripción</span>}
                </td>

                <td className="d-none d-md-table-cell">
                  {obtenerNombreCategoria(producto.categoria_producto)}
                </td>

                <td className="text-end fw-semibold">
                  ${parseFloat(producto.precio_venta || 0).toFixed(2)}
                </td>

                <td className="text-center">
                  <Button
                    variant="outline-warning"
                    size="sm"
                    className="m-1"
                    onClick={() => abrirModalEdicion(producto)}
                    title="Editar producto"
                  >
                    <i className="bi bi-pencil"></i>
                  </Button>

                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="m-1"
                    onClick={() => abrirModalEliminacion(producto)}
                    title="Eliminar producto"
                  >
                    <i className="bi bi-trash"></i>
                  </Button>
                  
                  <Button
                    variant="outline-success"
                    size="sm"
                    className="m-1"
                    onClick={() => copiarProducto(producto)}
                    title="Copiar al portapapeles"
                  >
                    <i className="bi bi-clipboard"></i>
                  </Button>

                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="m-1"
                    onClick={() => generarQRImagen(producto)}
                    title="Generar código QR de la imagen"
                  >
                    <i className="bi bi-qr-code"></i>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
};

export default TablaProductos;