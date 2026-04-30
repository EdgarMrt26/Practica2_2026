import React, { useState, useEffect, useCallback } from "react";
import { Card, Row, Col, Spinner, Button, Image } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

const TarjetaProducto = ({
  productos,
  abrirModalEdicion,
  abrirModalEliminacion,
  categorias, // para mostrar el nombre de la categoría
}) => {
  const [cargando, setCargando] = useState(true);
  const [idTarjetaActiva, setIdTarjetaActiva] = useState(null);

  useEffect(() => {
    setCargando(!(productos && productos.length > 0));
  }, [productos]);

  const manejarTeclaEscape = useCallback((evento) => {
    if (evento.key === "Escape") setIdTarjetaActiva(null);
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", manejarTeclaEscape);
    return () => window.removeEventListener("keydown", manejarTeclaEscape);
  }, [manejarTeclaEscape]);

  const alternarTarjetaActiva = (id) => {
    setIdTarjetaActiva((anterior) => (anterior === id ? null : id));
  };

  // Función auxiliar para obtener nombre de categoría
  const obtenerNombreCategoria = (idCategoria) => {
    if (!categorias || !idCategoria) return "Sin categoría";
    const categoria = categorias.find((cat) => cat.id_categoria === idCategoria);
    return categoria ? categoria.nombre_categoria : "Sin categoría";
  };

  return (
    <>
      {cargando ? (
        <div className="text-center my-5">
          <h5>Cargando productos...</h5>
          <Spinner animation="border" variant="success" role="status" />
        </div>
      ) : (
        <div>
          {productos.map((producto) => {
            const tarjetaActiva = idTarjetaActiva === producto.id_producto;

            return (
              <Card
                key={producto.id_producto}
                className="mb-3 border-0 rounded-3 shadow-sm w-100 tarjeta-producto-contenedor"
                onClick={() => alternarTarjetaActiva(producto.id_producto)}
                tabIndex={0}
                onKeyDown={(evento) => {
                  if (evento.key === "Enter" || evento.key === " ") {
                    evento.preventDefault();
                    alternarTarjetaActiva(producto.id_producto);
                  }
                }}
                aria-label={`Producto ${producto.nombre_producto}`}
              >
                <Card.Body
                  className={`p-3 tarjeta-producto-cuerpo ${
                    tarjetaActiva
                      ? "tarjeta-producto-cuerpo-activo"
                      : "tarjeta-producto-cuerpo-inactivo"
                  }`}
                >
                  <Row className="align-items-center gx-3">
                    {/* Imagen del producto */}
                    <Col xs={3} md={2} className="px-2">
                      {producto.url_imagen ? (
                        <Image
                          src={producto.url_imagen}
                          alt={producto.nombre_producto}
                          rounded
                          className="tarjeta-producto-imagen"
                          style={{
                            width: "65px",
                            height: "65px",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <div className="bg-light d-flex align-items-center justify-content-center rounded tarjeta-producto-placeholder-imagen">
                          <i className="bi bi-image text-muted fs-3"></i>
                        </div>
                      )}
                    </Col>

                    {/* Información del producto */}
                    <Col xs={5} md={6} className="text-start">
                      <div className="fw-semibold text-truncate">
                        {producto.nombre_producto}
                      </div>
                      <div className="small text-muted text-truncate">
                        {obtenerNombreCategoria(producto.categoria_producto)}
                      </div>
                      <div className="fw-bold text-success mt-1">
                        ${parseFloat(producto.precio_venta || 0).toFixed(2)}
                      </div>
                    </Col>

                    {/* Estado / Espacio para futuro badge */}
                    <Col
                      xs={4}
                      md={4}
                      className="d-flex flex-column align-items-end justify-content-center text-end"
                    >
                      <div className="fw-semibold small text-muted">Activo</div>
                    </Col>
                  </Row>
                </Card.Body>

                {/* Capa de acciones cuando la tarjeta está activa */}
                {tarjetaActiva && (
                  <div
                    role="dialog"
                    aria-modal="true"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIdTarjetaActiva(null);
                    }}
                    className="tarjeta-producto-capa"
                  >
                    <div
                      className="d-flex gap-2 tarjeta-producto-botones-capa"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="outline-warning"
                        size="sm"
                        onClick={() => {
                          abrirModalEdicion(producto);
                          setIdTarjetaActiva(null);
                        }}
                        aria-label={`Editar ${producto.nombre_producto}`}
                      >
                        <i className="bi bi-pencil"></i>
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => {
                          abrirModalEliminacion(producto);
                          setIdTarjetaActiva(null);
                        }}
                        aria-label={`Eliminar ${producto.nombre_producto}`}
                      >
                        <i className="bi bi-trash"></i>
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
};

export default TarjetaProducto;