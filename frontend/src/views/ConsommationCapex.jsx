import { useEffect, useState } from "react";
import { Container, Row, Col, Form, Card, ProgressBar, Table } from "react-bootstrap";
import ChartistGraph from "react-chartist";
import "chartist/dist/index.css";
import { getCapex, getConsommationCapex } from "../api/client.js";

const SERIES_COLORS = ["#51bcda", "#fbc658", "#ef8157", "#6bd098", "#ff6384", "#9966ff", "#4bc0c0", "#c9cbcf"];
const SERIES_LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h"];

function ConsommationCapex() {
  const [capexList, setCapexList] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [consommation, setConsommation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCapex()
      .then((list) => {
        setCapexList(list);
        if (list.length > 0) setSelectedId(list[0].Id);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    getConsommationCapex(selectedId)
      .then(setConsommation)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedId]);

  if (error) {
    return (
      <div className="content">
        <Container fluid>
          <p className="text-danger">{error}</p>
        </Container>
      </div>
    );
  }

  const parDepartement = consommation?.parDepartement ?? [];
  const pieLabels = parDepartement.map((d) => d.departementNom);
  const pieSeries = parDepartement.map((d) => d.montantConsomme);

  const donutData = {
    labels: pieLabels.length > 0 ? pieLabels : ["Aucune consommation"],
    series: pieSeries.length > 0 ? pieSeries : [1],
  };

  const donutOptions = {
    donut: true,
    donutWidth: 40,
    startAngle: 0,
    showLabel: false,
    chartPadding: 10,
  };

  // Assign explicit colors per slice via the Chartist draw event,
  // so we don't depend on ct-series-a/b/c CSS classes being present.
  const donutListener = {
    draw: (data) => {
      if (data.type === "slice") {
        data.element.attr({
          style: `stroke: ${SERIES_COLORS[data.index % SERIES_COLORS.length]}`,
        });
      }
    },
  };

  const budgetTotal = consommation?.budgetTotal ?? 0;
  const resteBudget = consommation?.resteBudget ?? 0;
  const consomme = budgetTotal - resteBudget;
  const pctConsomme = budgetTotal > 0 ? (consomme / budgetTotal) * 100 : 0;

  return (
    <div className="content">
      <Container fluid>
        <Row className="mb-4">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Capex</Form.Label>
              <Form.Select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
              >
                {capexList.map((c) => (
                  <option key={c.Id} value={c.Id}>
                    {c.nomCapex}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {loading && <p>Chargement...</p>}

        {!loading && consommation && (
          <Row>
            <Col md={6} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Body className="text-center">
                  <Card.Title as="h4" className="mb-1">
                    Consommation du Capex
                  </Card.Title>
                  <Card.Subtitle className="text-muted mb-3">
                    {consommation.nomCapex}
                  </Card.Subtitle>

                  <div
                    className="ct-chart"
                    id="chartConsommation"
                    style={{ maxWidth: 260, margin: "0 auto" }}
                  >
                    <ChartistGraph
                      data={donutData}
                      type="Pie"
                      options={donutOptions}
                      listener={donutListener}
                    />
                  </div>

                  <div className="d-flex flex-wrap justify-content-center gap-3 mt-3">
                    {parDepartement.map((d, i) => (
                      <span key={d.departementNom} className="d-inline-flex align-items-center">
                        <span
                          style={{
                            display: "inline-block",
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length],
                            marginRight: 6,
                          }}
                        />
                        {d.departementNom}
                      </span>
                    ))}
                  </div>

                  <hr />

                  <div className="text-start">
                    <div className="d-flex justify-content-between small mb-1">
                      <span>Engagé : {consomme.toLocaleString("fr-FR")} $</span>
                      <span>{pctConsomme.toFixed(1)}%</span>
                    </div>
                    <ProgressBar
                      now={pctConsomme}
                      variant={pctConsomme > 90 ? "danger" : pctConsomme > 70 ? "warning" : "success"}
                    />
                    <div className="text-muted small mt-2">
                      <i className="fa fa-history me-1" />
                      Budget total : {budgetTotal.toLocaleString("fr-FR")} $
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <Card.Title as="h4" className="mb-1">
                    Détail par département
                  </Card.Title>
                  <Card.Subtitle className="text-muted mb-3">
                    Montants engagés (Bon de commande + en attente)
                  </Card.Subtitle>

                  <Table hover responsive size="sm">
                    <thead>
                      <tr>
                        <th>Département</th>
                        <th className="text-end">Montant consommé</th>
                        <th className="text-end">% du budget</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parDepartement.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-center text-muted">
                            Aucune demande engagée sur ce Capex pour l'instant.
                          </td>
                        </tr>
                      ) : (
                        parDepartement.map((d, i) => (
                          <tr key={d.departementNom}>
                            <td>
                              <span
                                style={{
                                  display: "inline-block",
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length],
                                  marginRight: 8,
                                }}
                              />
                              {d.departementNom}
                            </td>
                            <td className="text-end">
                              {d.montantConsomme.toLocaleString("fr-FR")} $
                            </td>
                            <td className="text-end">
                              {budgetTotal > 0
                                ? ((d.montantConsomme / budgetTotal) * 100).toFixed(1)
                                : 0}
                              %
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td>
                          <strong>Reste budget</strong>
                        </td>
                        <td colSpan={2} className="text-end">
                          <strong>{resteBudget.toLocaleString("fr-FR")} $</strong>
                        </td>
                      </tr>
                    </tfoot>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
}

export default ConsommationCapex;