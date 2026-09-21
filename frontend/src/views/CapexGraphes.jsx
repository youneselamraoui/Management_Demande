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
const totalConsomme = parDepartement.reduce((sum, d) => sum + d.montantConsomme, 0); // committed = Purchase order + pending
const resteBudget = budgetTotal - totalConsomme;
const montantEnAttente = consommation?.montantEnAttente ?? consommation?.MontantEnAttente ?? 0;
const montantValide = Math.max(0, totalConsomme - montantEnAttente);

  // Each slice of the pie = a committed department (including pending).
  // We add a "Remaining budget" slice to visualize what is not yet committed.
  const chartData = [
    ...parDepartement.map((d) => ({
      name: d.departementNom,
      value: d.montantConsomme,
    })),
    ...(resteBudget > 0
      ? [{ name: "Remaining budget", value: resteBudget, isReste: true }]
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

        {loading && <p>Loading...</p>}

        {!loading && consommation && (
          <Row>
            <Col md={7} className="mb-4">
              <Card className="shadow-sm h-100">
                <Card.Body>
                  <Card.Title as="h4" className="mb-1">
                    Commitment breakdown
                  </Card.Title>
                  <Card.Subtitle className="text-muted mb-3">
                    {consommation.nomCapex} — Total budget:{" "}
                    {budgetTotal.toLocaleString("en-US")} $ (committed: Purchase order + pending)
                  </Card.Subtitle>
                  <div className="d-flex flex-wrap gap-2 mb-3 small">
                    <span className="badge bg-success">Approved: {montantValide.toLocaleString("en-US")} $</span>
                    <span className="badge bg-warning text-dark">Pending: {montantEnAttente.toLocaleString("en-US")} $</span>
                    <span className="badge bg-secondary">Total committed: {totalConsomme.toLocaleString("en-US")} $</span>
                  </div>

                  {chartData.length === 0 ? (
                    <p className="text-muted text-center py-5">
                      No data to display for this Capex.
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
                            `${value.toLocaleString("en-US")} $`
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
                    Breakdown by department
                  </Card.Title>

                  {parDepartement.length === 0 ? (
                    <p className="text-muted">
                      No committed requests for this Capex yet.
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
                            {d.montantConsomme.toLocaleString("en-US")} $
                          </strong>
                        </li>
                      ))}
                    </ul>
                  )}

                  <hr />
                  <div className="small mb-2">
                    <div className="d-flex justify-content-between"><span className="text-success">Approved (Purchase order)</span><strong className="text-success">{montantValide.toLocaleString("en-US")} $</strong></div>
                    <div className="d-flex justify-content-between"><span className="text-warning">Pending (reserved)</span><strong className="text-warning">{montantEnAttente.toLocaleString("en-US")} $</strong></div>
                    <div className="d-flex justify-content-between fw-bold border-top pt-2 mt-2"><span>Total committed (Consumption)</span><strong>{totalConsomme.toLocaleString("en-US")} $</strong></div>
                    <div className="d-flex gap-1 mt-2" style={{ height: 8, borderRadius: 4, overflow: "hidden", background: "#e9ecef" }}>
                      <div style={{ width: `${budgetTotal > 0 ? (montantValide / budgetTotal) * 100 : 0}%`, background: "#198754" }} />
                      <div style={{ width: `${budgetTotal > 0 ? (montantEnAttente / budgetTotal) * 100 : 0}%`, background: "#ffc107" }} />
                    </div>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Remaining budget</span>
                    <strong>{resteBudget.toLocaleString("en-US")} $</strong>
                  </div>
                  <p className="text-muted small mt-2 mb-0">Consumption = Approved + Pending.</p>
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
