import { useEffect, useState } from "react";
import { Container, Row, Col, Form, Card } from "react-bootstrap";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getCapex, getConsommationCapex } from "../api/client.js";

const COLORS = [
  "#51bcda", "#fbc658", "#ef8157", "#6bd098",
  "#ff6384", "#9966ff", "#4bc0c0", "#c9cbcf",
];

function CapexGraphes() {
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

const budgetTotal = consommation?.budgetTotal ?? 0;
const parDepartement = consommation?.parDepartement ?? [];
const totalConsomme = parDepartement.reduce((sum, d) => sum + d.montantConsomme, 0); // engagé = Bon de commande + en attente
const resteBudget = budgetTotal - totalConsomme; 

  // Chaque part du cercle = un département engagé (incluant en attente).
  // On ajoute une part "Reste budget" pour visualiser ce qui n'est pas encore engagé.
  const chartData = [
    ...parDepartement.map((d) => ({
      name: d.departementNom,
      value: d.montantConsomme,
    })),
    ...(resteBudget > 0
      ? [{ name: "Reste budget", value: resteBudget, isReste: true }]
      : []),
  ];

  const renderLabel = ({ name, percent }) =>
    `${name} ${(percent * 100).toFixed(0)}%`;

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
            <Col md={7} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <Card.Title as="h4" className="mb-1">
                    Répartition de l'engagement
                  </Card.Title>
                  <Card.Subtitle className="text-muted mb-3">
                    {consommation.nomCapex} — Budget total :{" "}
                    {budgetTotal.toLocaleString("fr-FR")} $ (engagé : Bon de commande + en attente)
                  </Card.Subtitle>

                  {chartData.length === 0 ? (
                    <p className="text-muted text-center py-5">
                      Aucune donnée à afficher pour ce Capex.
                    </p>
                  ) : (
                    <ResponsiveContainer width="100%" height={380}>
                      <PieChart>
                        <Pie
                          data={chartData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={80}
                          outerRadius={140}
                          paddingAngle={2}
                          label={renderLabel}
                        >
                          {chartData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={
                                entry.isReste
                                  ? "#e0e0e0"
                                  : COLORS[index % COLORS.length]
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value) =>
                            `${value.toLocaleString("fr-FR")} $`
                          }
                        />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col md={5} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <Card.Title as="h4" className="mb-3">
                    Détail par département
                  </Card.Title>

                  {parDepartement.length === 0 ? (
                    <p className="text-muted">
                      Aucune demande engagée sur ce Capex pour l'instant.
                    </p>
                  ) : (
                    <ul className="list-unstyled">
                      {parDepartement.map((d, i) => (
                        <li
                          key={d.departementNom}
                          className="d-flex justify-content-between align-items-center mb-2"
                        >
                          <span>
                            <span
                              style={{
                                display: "inline-block",
                                width: 10,
                                height: 10,
                                borderRadius: "50%",
                                backgroundColor: COLORS[i % COLORS.length],
                                marginRight: 8,
                              }}
                            />
                            {d.departementNom}
                          </span>
                          <strong>
                            {d.montantConsomme.toLocaleString("fr-FR")} $
                          </strong>
                        </li>
                      ))}
                    </ul>
                  )}

                  <hr />
                  <div className="d-flex justify-content-between">
                    <span>Reste budget</span>
                    <strong>{resteBudget.toLocaleString("fr-FR")} $</strong>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
}

export default CapexGraphes;