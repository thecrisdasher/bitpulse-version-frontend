import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Box,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import { tradingAnalysisService } from '@/lib/services/tradingAnalysisService';
import { bitstampService } from '@/lib/services/bitstampService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`trading-tabpanel-${index}`}
      aria-labelledby={`trading-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function TradingAnalysis() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<any>({});
  const [selectedSymbol, setSelectedSymbol] = useState('bitcoin');

  useEffect(() => {
    loadAnalysisData();
  }, [selectedSymbol]);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener datos OHLC
      const ohlcData = await bitstampService.getOHLCData(selectedSymbol);
      
      if (!ohlcData || ohlcData.length === 0) {
        throw new Error('No se pudieron obtener datos para el análisis');
      }

      // Calcular niveles de Fibonacci
      const high = Math.max(...ohlcData.map(d => d.high));
      const low = Math.min(...ohlcData.map(d => d.low));
      const fibLevels = tradingAnalysisService.calculateFibonacciLevels(high, low);

      // Calcular puntos pivote
      const lastCandle = ohlcData[ohlcData.length - 1];
      const pivotPoints = tradingAnalysisService.calculatePivotPoints(
        lastCandle.high,
        lastCandle.low,
        lastCandle.close
      );

      // Calcular RSI
      const prices = ohlcData.map(d => d.close);
      const rsi = tradingAnalysisService.calculateRSI(prices);

      // Calcular Bandas de Bollinger
      const bollinger = tradingAnalysisService.calculateBollingerBands(prices);

      // Calcular MACD
      const macd = tradingAnalysisService.calculateMACD(prices);

      // Identificar patrones de velas
      const patterns = tradingAnalysisService.identifyCandlePattern(ohlcData.slice(-3));

      // Calcular soportes y resistencias
      const supportResistance = tradingAnalysisService.calculateSupportResistance(ohlcData);

      setAnalysisData({
        fibonacci: fibLevels,
        pivotPoints,
        rsi,
        bollinger,
        macd,
        patterns,
        supportResistance
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los datos de análisis');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          aria-label="análisis de trading tabs"
        >
          <Tab icon={<TrendingUpIcon />} label="Fibonacci y Pivotes" />
          <Tab icon={<ShowChartIcon />} label="Indicadores" />
          <Tab icon={<TimelineIcon />} label="Patrones" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Niveles de Fibonacci
                  </Typography>
                  <List dense>
                    {Object.entries(analysisData.fibonacci?.retracementLevels || {}).map(([level, value]) => (
                      <ListItem key={level}>
                        <ListItemText
                          primary={`${level.replace('level', '')}%`}
                          secondary={value.toFixed(2)}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Puntos Pivote
                  </Typography>
                  <List dense>
                    {Object.entries(analysisData.pivotPoints || {}).map(([point, value]) => (
                      <ListItem key={point}>
                        <ListItemText
                          primary={point.toUpperCase()}
                          secondary={Number(value).toFixed(2)}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    RSI
                  </Typography>
                  <Typography variant="h4" color={
                    analysisData.rsi?.isOverbought ? 'error' :
                    analysisData.rsi?.isOversold ? 'success.main' :
                    'text.primary'
                  }>
                    {analysisData.rsi?.rsi.toFixed(2)}
                  </Typography>
                  <Box mt={1}>
                    {analysisData.rsi?.isOverbought && (
                      <Chip label="Sobrecomprado" color="error" size="small" />
                    )}
                    {analysisData.rsi?.isOversold && (
                      <Chip label="Sobrevendido" color="success" size="small" />
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Bandas de Bollinger
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Superior" secondary={analysisData.bollinger?.upper.toFixed(2)} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Media" secondary={analysisData.bollinger?.middle.toFixed(2)} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Inferior" secondary={analysisData.bollinger?.lower.toFixed(2)} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    MACD
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemText primary="Línea MACD" secondary={analysisData.macd?.macdLine.toFixed(4)} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Señal" secondary={analysisData.macd?.signalLine.toFixed(4)} />
                    </ListItem>
                    <ListItem>
                      <ListItemText primary="Histograma" secondary={analysisData.macd?.histogram.toFixed(4)} />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Patrones de Velas
                  </Typography>
                  {analysisData.patterns?.length > 0 ? (
                    <List>
                      {analysisData.patterns.map((pattern: string, index: number) => (
                        <ListItem key={index}>
                          <Chip label={pattern} color="primary" />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography color="textSecondary">
                      No se detectaron patrones significativos
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Soportes y Resistencias
                  </Typography>
                  <Box mb={2}>
                    <Typography variant="subtitle1" gutterBottom>
                      Resistencias
                    </Typography>
                    {analysisData.supportResistance?.resistances.map((level: number, index: number) => (
                      <Chip
                        key={`r-${index}`}
                        label={level.toFixed(2)}
                        color="error"
                        size="small"
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                  <Divider />
                  <Box mt={2}>
                    <Typography variant="subtitle1" gutterBottom>
                      Soportes
                    </Typography>
                    {analysisData.supportResistance?.supports.map((level: number, index: number) => (
                      <Chip
                        key={`s-${index}`}
                        label={level.toFixed(2)}
                        color="success"
                        size="small"
                        sx={{ m: 0.5 }}
                      />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
} 