import React, { useMemo } from 'react';
import { Bar, Pie, Scatter } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const DynamicDashboard = ({ rawData, cleanedData }) => {
  const parseCSV = (csv) => {
    if (!csv) return [];
    const lines = csv.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj, header, index) => {
        obj[header] = values[index] ? values[index].trim() : '';
        return obj;
      }, {});
    });
  };

  const raw = parseCSV(rawData);
  const cleaned = parseCSV(cleanedData);
  const columnAnalysis = useMemo(() => {
    if (raw.length === 0) return {};
    
    const sample = raw[0];
    return Object.keys(sample).reduce((acc, key) => {
      const numericValues = raw.filter(item => !isNaN(parseFloat(item[key]))).length;
      const isNumeric = numericValues / raw.length > 0.7;
      
      const uniqueValues = [...new Set(raw.map(item => item[key]))].length;
      const isCategorical = !isNumeric && uniqueValues < 10 && uniqueValues > 1;
      
      acc[key] = {
        isNumeric,
        isCategorical,
        uniqueValues,
        sampleValues: [...new Set(raw.map(item => item[key]).slice(0, 3))]
      };
      return acc;
    }, {});
  }, [raw]);

  const generateCharts = () => {
    const numericColumns = Object.keys(columnAnalysis).filter(key => columnAnalysis[key].isNumeric);
    const categoricalColumns = Object.keys(columnAnalysis).filter(key => columnAnalysis[key].isCategorical);

    return (
      <div className="space-y-8">
        {numericColumns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {numericColumns.map((col, index) => (
                index > 0 && (
                  <div key={`num-${col}`} className="bg-white p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold mb-3">{`Distribution de ${col}`}</h3>
                    <Bar
                      data={{
                        labels: ['Brut', 'Nettoyé'],
                        datasets: [
                          {
                            label: 'Moyenne',
                            data: [
                              raw.reduce((sum, item) => sum + (parseFloat(item[col]) || 0), 0) / raw.length,
                              cleaned.reduce((sum, item) => sum + (parseFloat(item[col]) || 0), 0) / cleaned.length
                            ],
                            backgroundColor: '#36A2EB'
                          },
                          {
                            label: 'Écart-type',
                            data: [
                              Math.sqrt(raw.reduce((sum, item) => {
                                const val = parseFloat(item[col]) || 0;
                                const mean = raw.reduce((s, i) => s + (parseFloat(i[col]) || 0), 0) / raw.length;
                                return sum + Math.pow(val - mean, 2);
                              }, 0) / raw.length),
                              Math.sqrt(cleaned.reduce((sum, item) => {
                                const val = parseFloat(item[col]) || 0;
                                const mean = cleaned.reduce((s, i) => s + (parseFloat(i[col]) || 0), 0) / cleaned.length;
                                return sum + Math.pow(val - mean, 2);
                              }, 0) / cleaned.length)
                            ],
                            backgroundColor: '#FF6384'
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: 'top' },
                          tooltip: { enabled: true }
                        }
                      }}
                    />
                  </div>
                )
              ))}
          </div>
        )}

        {categoricalColumns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categoricalColumns.map(col => (
              <div key={`cat-${col}`} className="bg-white p-4 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-3">{`Répartition de ${col}`}</h3>
                <Pie
                  data={{
                    labels: [...new Set([...raw.map(item => item[col]), ...cleaned.map(item => item[col])])],
                    datasets: [
                      {
                        label: 'Brut',
                        data: [...new Set([...raw.map(item => item[col]), ...cleaned.map(item => item[col])])].map(
                          val => raw.filter(item => item[col] === val).length
                        ),
                        backgroundColor: [
                          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                          '#9966FF', '#FF9F40', '#8AC24A', '#607D8B'
                        ]
                      },
                      {
                        label: 'Nettoyé',
                        data: [...new Set([...raw.map(item => item[col]), ...cleaned.map(item => item[col])])].map(
                          val => cleaned.filter(item => item[col] === val).length
                        ),
                        backgroundColor: [
                          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                          '#9966FF', '#FF9F40', '#8AC24A', '#607D8B'
                        ]
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      tooltip: { enabled: true }
                    }
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {numericColumns.length >= 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {numericColumns
              .filter((_, index) => index > 0) 
              .slice(0, 4) 
              .map((col1, i) => (
                numericColumns
                  .filter((_, index) => index > 0) 
                  .slice(i + 1, i + 2)
                  .map(col2 => (
                    <div key={`corr-${col1}-${col2}`} className="bg-white p-4 rounded-lg shadow">
                      <h3 className="text-lg font-semibold mb-3">{`Corrélation ${col1} vs ${col2}`}</h3>
                      <Scatter
                        data={{
                          datasets: [
                            {
                              label: 'Brut',
                              data: raw.map(item => ({
                                x: parseFloat(item[col1]) || 0,
                                y: parseFloat(item[col2]) || 0
                              })),
                              backgroundColor: '#FF6384',
                              pointRadius: 5
                            },
                            {
                              label: 'Nettoyé',
                              data: cleaned.map(item => ({
                                x: parseFloat(item[col1]) || 0,
                                y: parseFloat(item[col2]) || 0
                              })),
                              backgroundColor: '#36A2EB',
                              pointRadius: 5
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          plugins: {
                            legend: { position: 'top' },
                            tooltip: { enabled: true }
                          },
                          scales: {
                            x: { title: { display: true, text: col1 }},
                            y: { title: { display: true, text: col2 }}
                          }
                        }}
                      />
                    </div>
                  ))
              ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Données Brutes (Aperçu)</h3>
            <div className="overflow-x-auto max-h-80">
              <table className="table-auto w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    {raw[0] && Object.keys(raw[0]).map(key => (
                      <th key={`raw-${key}`} className="px-4 py-2 text-left">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {raw.slice(0, 10).map((row, i) => (
                    <tr key={`raw-row-${i}`} className="border-t">
                      {Object.values(row).map((val, j) => (
                        <td key={`raw-cell-${i}-${j}`} className="px-4 py-2">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Données Nettoyées (Aperçu)</h3>
            <div className="overflow-x-auto max-h-80">
              <table className="table-auto w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    {cleaned[0] && Object.keys(cleaned[0]).map(key => (
                      <th key={`clean-${key}`} className="px-4 py-2 text-left">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cleaned.slice(0, 10).map((row, i) => (
                    <tr key={`clean-row-${i}`} className="border-t">
                      {Object.values(row).map((val, j) => (
                        <td key={`clean-cell-${i}-${j}`} className="px-4 py-2">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-8">Analyse Dynamique des Données</h1>
      
      {raw.length === 0 ? (
        <div className="text-center text-gray-500">
          Aucune donnée à afficher. Veuillez importer un fichier CSV valide.
        </div>
      ) : (
        <>
          <div className="mb-8 bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Analyse des Colonnes</h2>
            <div className="overflow-x-auto">
              <table className="table-auto w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Colonne</th>
                    <th className="px-4 py-2 text-left">Type</th>
                    <th className="px-4 py-2 text-left">Valeurs Uniques</th>
                    <th className="px-4 py-2 text-left">Exemples</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(columnAnalysis).map(([col, analysis]) => (
                    <tr key={`analysis-${col}`} className="border-t">
                      <td className="px-4 py-2">{col}</td>
                      <td className="px-4 py-2">
                        {analysis.isNumeric ? 'Numérique' : 
                         analysis.isCategorical ? 'Catégoriel' : 'Autre'}
                      </td>
                      <td className="px-4 py-2">{analysis.uniqueValues}</td>
                      <td className="px-4 py-2">{analysis.sampleValues.join(', ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {generateCharts()}
        </>
      )}
    </div>
  );
};

export default DynamicDashboard;