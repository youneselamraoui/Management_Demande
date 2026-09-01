import { useEffect, useState } from "react";
import { Container, Row, Col, FormGroup, ControlLabel } from "react-bootstrap";
import ChartistGraph from "react-chartist";
import Card from "components/Card/Card.jsx";
import { getCapex, getConsommationCapex } from "api/client.js";

const SERIES_LETTERS = ["a", "b", "c", "d", "e", "f", "g", "h"];

function ConsommationCapex() {
  const [capexList, setCapexList] = useState([]);
  const [selectedCapexId, setSelectedCapexId] = useState("");
  const [consommation, setConsommation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getCapex()
      .then((list) => {
        setCapexList(list);
        if (list.length > 0) setSelectedCapexId(list[0].capexId);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCapexId) return;
    setLoading(true);
    getConsommationCapex(selectedCapexId)
      .then(setConsommation)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedCapexId]);

  if (error) {
    return (
      <div className="content">
        <Container fluid><p className="text-danger">{error}</p></Container>
      </div>
    );
  }

  const pieLabels = consommation ? consommation.parDepartement.map((d) => d.departementNom) : [];
  const pieSeries = consommation ? consommation.parDepartement.map((d) => d.montantConsomme) : [];

  const donutData = {
    labels: pieLabels.length > 0 ? pieLabels : ["Aucune consommation"],
    series: pieSeries.length > 0 ? pieSeries : [1],
  };

  const donutOptions = {
    donut: true,
    donutWidth: 40,
    startAngle: 0,
    showLabel: false,
  };

  return (
    <div className="content">
      <Container fluid>
        <Row>
          <Col md={4}>
            <FormGroup>
              <ControlLabel>Capex</ControlLabel>
              <select
                className="form-control"
                value={selectedCapexId}
                onChange={(e) => setSelectedCapexId(e.target.value)}
              >
                {capexList.map((c) => (
                  <option key={c.capexId} value={c.capexId}>{c.nomCapex}</option>
                ))}
              </select>
            </FormGroup>
          </Col>
        </Row>

        {loading && <p>Chargement...</p>}

        {!loading && consommation && (
          <Row>
            <Col md={6}>
              <Card
                title="Consommation du Capex"
                category={consommation.nomCapex}
                content={
                  <div className="ct-chart" id="chartConsommation">
                    <ChartistGraph data={donutData} type="Pie" options={donutOptions} />
                  </div>
                }
                legend={
                  <div className="legend">
                    {consommation.parDepartement.map((d, i) => (
                      <span key={d.departementNom} style={{ marginRight: 12 }}>
                        <i className={`fa fa-circle ct-series-${SERIES_LETTERS[i % SERIES_LETTERS.length]}-legend`} />{" "}
                        {d.departementNom}
                      </span>
                    ))}
                  </div>
                }
                stats={
                  <div className="stats">
                    <i className="fa fa-history" /> Budget total : {consommation.budgetTotal.toLocaleString("fr-FR")} MAD
                  </div>
                }
              />
            </Col>

            <Col md={6}>
              <Card
                title="Détail par département"
                category="Montants validés (statut : validé directeur)"
                content={
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Département</th>
                        <th>Montant consommé</th>
                        <th>% du budget</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consommation.parDepartement.length === 0 ? (
                        <tr><td colSpan={3}>Aucune demande validée sur ce Capex pour l'instant.</td></tr>
                      ) : (
                        consommation.parDepartement.map((d) => (
                          <tr key={d.departementNom}>
                            <td>{d.departementNom}</td>
                            <td>{d.montantConsomme.toLocaleString("fr-FR")} MAD</td>
                            <td>
                              {consommation.budgetTotal > 0
                                ? ((d.montantConsomme / consommation.budgetTotal) * 100).toFixed(1)
                                : 0}%
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td><strong>Reste budget</strong></td>
                        <td colSpan={2}><strong>{consommation.resteBudget.toLocaleString("fr-FR")} MAD</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                }
              />
            </Col>
          </Row>
        )}
      </Container>
    </div>
  );
}

export default ConsommationCapex;