# ============================================
# FILE: forecast_models.py - ML Forecasting
# ============================================

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
import logging
from datetime import datetime, timedelta
import pickle
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================
# 1. PROPHET FORECASTING
# ============================================

class ProphetForecaster:
    """
    Facebook Prophet - Time series forecasting
    Good for: handling seasonality, trends, holidays
    """
    
    def __init__(self):
        try:
            from prophet import Prophet
            self.Prophet = Prophet
        except ImportError:
            logger.warning("Prophet not installed. Run: pip install prophet")
            self.Prophet = None
    
    def prepare_data(self, df: pd.DataFrame, value_col: str) -> pd.DataFrame:
        """
        Convert to Prophet format (ds, y)
        """
        prophet_df = pd.DataFrame({
            'ds': pd.to_datetime(df.index),
            'y': df[value_col].values
        })
        return prophet_df
    
    def fit_forecast(self, data, periods: int = 6) -> Dict:
        """
        Fit Prophet model and forecast
        
        Args:
            data: pd.Series or pd.DataFrame with time series data
            periods: Number of periods to forecast
        """
        if self.Prophet is None:
            logger.error("Prophet not available")
            return None
        
        try:
            # Convert Series to Prophet DataFrame format
            if isinstance(data, pd.Series):
                # Create date range for the series
                dates = pd.date_range(end=pd.Timestamp.today(), periods=len(data), freq='MS')
                df = pd.DataFrame({
                    'ds': dates,
                    'y': data.values
                })
            elif isinstance(data, pd.DataFrame):
                # Check if already in Prophet format
                if 'ds' not in data.columns or 'y' not in data.columns:
                    logger.error("Dataframe must have columns 'ds' and 'y' with the dates and values respectively.")
                    return None
                df = data
            else:
                logger.error("Data must be pandas Series or DataFrame")
                return None
            
            model = self.Prophet(
                yearly_seasonality=True,
                weekly_seasonality=False,
                daily_seasonality=False,
                interval_width=0.95
            )
            
            # Fit
            model.fit(df)
            
            # Forecast
            future = model.make_future_dataframe(periods=periods, freq='MS')
            forecast = model.predict(future)
            
            # Extract predictions (only future periods)
            predictions = forecast['yhat'].tail(periods).values
            
            # Extract results
            result = {
                'predictions': predictions.tolist(),
                'forecast_values': predictions.tolist(),  # For backward compatibility
                'upper': forecast['yhat_upper'].tail(periods).values.tolist(),
                'lower': forecast['yhat_lower'].tail(periods).values.tolist(),
                'model': model
            }
            
            logger.info(f"Prophet forecast complete: {periods} periods")
            return result
        
        except Exception as e:
            logger.error(f"Prophet error: {e}")
            return None
    
    def get_components(self, model):
        """Get trend/seasonal components"""
        try:
            fig = model.plot_components(model)
            return fig
        except:
            return None

# ============================================
# 2. ARIMA/SARIMA FORECASTING
# ============================================

class ARIMAForecaster:
    """
    ARIMA/SARIMA for time series with seasonality
    """
    
    def __init__(self):
        try:
            from statsmodels.tsa.statespace.sarimax import SARIMAX
            self.SARIMAX = SARIMAX
        except ImportError:
            logger.warning("statsmodels not installed. Run: pip install statsmodels")
            self.SARIMAX = None
    
    def fit_forecast(self, series: pd.Series, order=(1,1,1), 
                     seasonal_order=(1,1,1,12), periods=6) -> Dict:
        """
        Fit SARIMA and forecast
        order: (p, d, q)
        seasonal_order: (P, D, Q, s)
        """
        if self.SARIMAX is None:
            logger.error("SARIMA not available")
            return None
        
        try:
            model = self.SARIMAX(
                series,
                order=order,
                seasonal_order=seasonal_order,
                enforce_stationarity=False,
                enforce_invertibility=False
            )
            
            fitted_model = model.fit(disp=False)
            forecast_result = fitted_model.get_forecast(steps=periods)
            
            result = {
                'forecast': forecast_result.predicted_mean.values.tolist(),
                'ci': forecast_result.conf_int(alpha=0.05).values.tolist(),
                'model': fitted_model
            }
            
            logger.info(f"SARIMA forecast complete: {periods} periods")
            return result
        
        except Exception as e:
            logger.error(f"SARIMA error: {e}")
            return None

# ============================================
# 3. XGBOOST FORECASTING
# ============================================

class XGBoostForecaster:
    """
    XGBoost for job trend forecasting
    Features: lag counts, growth rate, volume, external indicators
    """
    
    def __init__(self):
        try:
            import xgboost as xgb
            self.xgb = xgb
        except ImportError:
            logger.warning("XGBoost not installed. Run: pip install xgboost")
            self.xgb = None
    
    def create_features(self, series: pd.Series, lags: List[int] = [1, 3, 6, 12]) -> pd.DataFrame:
        """
        Create lag features + rolling statistics
        """
        df = pd.DataFrame({'value': series})
        
        # Lag features
        for lag in lags:
            df[f'lag_{lag}'] = df['value'].shift(lag)
        
        # Rolling statistics
        df['rolling_mean_3'] = df['value'].rolling(3).mean()
        df['rolling_std_3'] = df['value'].rolling(3).std()
        df['rolling_mean_6'] = df['value'].rolling(6).mean()
        
        # Momentum
        df['momentum_3'] = df['value'].diff(3)
        df['momentum_6'] = df['value'].diff(6)
        
        # Drop NaN
        df = df.dropna()
        
        return df
    
    def fit_forecast(self, series: pd.Series, periods: int = 6, 
                     test_size: float = 0.2) -> Dict:
        """
        Fit XGBoost and forecast
        """
        if self.xgb is None:
            logger.error("XGBoost not available")
            return None
        
        try:
            # Create features
            df = self.create_features(series)
            
            X = df.drop('value', axis=1)
            y = df['value']
            
            # Train-test split
            split = int(len(df) * (1 - test_size))
            X_train, X_test = X[:split], X[split:]
            y_train, y_test = y[:split], y[split:]
            
            # Train XGBoost model
            model = self.xgb.XGBRegressor(
                n_estimators=100,
                max_depth=5,
                learning_rate=0.1,
                subsample=0.8,
                random_state=42,
                early_stopping_rounds=10  # Move to constructor for newer versions
            )
            
            # Fit model
            model.fit(
                X_train, y_train,
                eval_set=[(X_test, y_test)],
                verbose=False
            )
            
            # Calculate test score
            from sklearn.metrics import mean_absolute_error, r2_score
            y_pred = model.predict(X_test)
            mae = mean_absolute_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            logger.info(f"XGBoost - MAE: {mae:.2f}, R²: {r2:.3f}")
            
            # Forecast future periods
            last_features = X.iloc[-1:].copy()
            forecasts = []
            
            for i in range(periods):
                pred = model.predict(last_features)[0]
                forecasts.append(pred)
                
                # Update features for next iteration
                last_features = last_features.shift(1)
                last_features['lag_1'] = pred
            
            result = {
                'predictions': [max(0, int(f)) for f in forecasts],
                'forecast': [max(0, int(f)) for f in forecasts],  # For backward compatibility
                'mae': mae,
                'r2': r2,
                'model': model,
                'feature_importance': dict(zip(X.columns, model.feature_importances_))
            }
            
            return result
        
        except Exception as e:
            logger.error(f"XGBoost error: {e}")
            return None
    
    def get_feature_importance(self, model) -> Dict:
        """Extract feature importance"""
        if not hasattr(model, 'feature_importances_'):
            return {}
        
        importance = dict(zip(
            ['lag_1', 'lag_3', 'lag_6', 'lag_12', 'rolling_mean_3', 
             'rolling_std_3', 'momentum_3', 'momentum_6'],
            model.feature_importances_
        ))
        
        return dict(sorted(importance.items(), key=lambda x: x[1], reverse=True))

# ============================================
# 4. ENSEMBLE FORECASTING
# ============================================

class EnsembleForecaster:
    """
    Combine Prophet + XGBoost for robust forecasts
    Default weights: Prophet 0.4, XGBoost 0.6
    """
    
    def __init__(self, prophet_weight=0.4, xgboost_weight=0.6):
        self.prophet = ProphetForecaster()
        self.xgboost = XGBoostForecaster()
        self.prophet_weight = prophet_weight
        self.xgboost_weight = xgboost_weight
    
    def fit_forecast(self, series: pd.Series, periods: int = 6) -> Dict:
        """
        Ensemble forecast combining Prophet + XGBoost
        """
        
        prophet_result = None
        xgboost_result = None
        
        # Prophet forecast
        try:
            prophet_result = self.prophet.fit_forecast(series, periods=periods)
        except Exception as e:
            logger.warning(f"Prophet forecast failed: {e}")
        
        # XGBoost forecast
        try:
            xgboost_result = self.xgboost.fit_forecast(series, periods=periods)
        except Exception as e:
            logger.warning(f"XGBoost forecast failed: {e}")
        
        # Ensemble
        if prophet_result and xgboost_result:
            # Use 'predictions' key (already added above)
            prophet_preds = prophet_result.get('predictions', prophet_result.get('forecast_values', []))
            xgboost_preds = xgboost_result.get('predictions', xgboost_result.get('forecast', []))
            
            forecast = [
                int(self.prophet_weight * p + self.xgboost_weight * x)
                for p, x in zip(prophet_preds, xgboost_preds)
            ]
            
            logger.info(f"Ensemble forecast: {self.prophet_weight*100:.0f}% Prophet + {self.xgboost_weight*100:.0f}% XGBoost")
        
        elif xgboost_result:
            forecast = xgboost_result.get('predictions', xgboost_result.get('forecast', []))
            logger.info("Using XGBoost only (Prophet failed)")
        
        elif prophet_result:
            forecast = prophet_result.get('predictions', prophet_result.get('forecast_values', []))
            logger.info("Using Prophet only (XGBoost failed)")
        
        else:
            # Fallback: simple trend
            trend = (series.iloc[-1] - series.iloc[-3]) / 2 if len(series) >= 3 else 0
            forecast = [
                max(0, int(series.iloc[-1] + trend * (i + 1)))
                for i in range(periods)
            ]
            logger.info("Using fallback trend (both models failed)")
        
        return {
            'predictions': forecast,
            'forecast': forecast,  # For backward compatibility
            'prophet': prophet_result,
            'xgboost': xgboost_result,
            'method': 'ensemble'
        }

# ============================================
# 5. FORECAST EXPLAINABILITY
# ============================================

class ForecastExplainer:
    """
    Explain forecasts using SHAP or feature importance
    """
    
    @staticmethod
    def generate_explanation(forecast: Dict, series: pd.Series, 
                            item_name: str) -> Dict:
        """
        Generate human-readable explanation for forecast
        """
        
        # Calculate metrics
        recent_value = series.iloc[-1]
        forecast_value = forecast['forecast'][0] if forecast['forecast'] else recent_value
        change_pct = ((forecast_value - recent_value) / recent_value * 100) if recent_value > 0 else 0
        
        # Determine trend
        if change_pct > 20:
            trend_desc = "🚀 Strong Uptrend - High demand expected"
            icon = "📈"
        elif change_pct > 5:
            trend_desc = "📈 Moderate Growth - Steady demand"
            icon = "📊"
        elif change_pct > -5:
            trend_desc = "➡️ Stable - Steady demand"
            icon = "➡️"
        else:
            trend_desc = "📉 Declining - Lower demand"
            icon = "📉"
        
        # Feature importance if XGBoost
        factors = []
        if 'xgboost' in forecast and forecast['xgboost']:
            importance = forecast['xgboost'].get('feature_importance', {})
            top_factors = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:3]
            factors = [f"{name}: {imp:.1%}" for name, imp in top_factors]
        
        return {
            'item': item_name,
            'current_value': recent_value,
            'forecast_next_period': forecast_value,
            'change_percent': f"{change_pct:+.1f}%",
            'trend': trend_desc,
            'trend_icon': icon,
            'top_factors': factors,
            'confidence': forecast.get('r2', 0.75),  # From XGBoost
            'recommendation': "Monitor this skill" if change_pct > 15 else "Stable"
        }

# ============================================
# 6. MODEL PERSISTENCE
# ============================================

class ModelManager:
    """Save/load trained models"""
    
    @staticmethod
    def save_model(model, model_name: str, model_dir: str = "models"):
        """Save model to disk"""
        os.makedirs(model_dir, exist_ok=True)
        filepath = os.path.join(model_dir, f"{model_name}.pkl")
        
        try:
            with open(filepath, 'wb') as f:
                pickle.dump(model, f)
            logger.info(f"Model saved: {filepath}")
        except Exception as e:
            logger.error(f"Failed to save model: {e}")
    
    @staticmethod
    def load_model(model_name: str, model_dir: str = "models"):
        """Load model from disk"""
        filepath = os.path.join(model_dir, f"{model_name}.pkl")
        
        try:
            with open(filepath, 'rb') as f:
                model = pickle.load(f)
            logger.info(f"Model loaded: {filepath}")
            return model
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            return None

# ============================================
# 7. BATCH FORECASTING
# ============================================

def batch_forecast_all_skills(db_session, forecast_periods: int = 6) -> List[Dict]:
    """
    Generate forecasts for all skills in database
    """
    from main import SkillTrend  # Import DB models
    
    forecaster = EnsembleForecaster()
    explainer = ForecastExplainer()
    
    # Get all unique skills
    skills = db_session.query(SkillTrend.skill.distinct()).all()
    
    forecasts = []
    
    for (skill,) in skills:
        # Get historical data
        history = db_session.query(SkillTrend).filter(
            SkillTrend.skill == skill
        ).order_by(SkillTrend.month).all()
        
        if len(history) < 3:
            logger.warning(f"Insufficient data for {skill}, skipping")
            continue
        
        # Create series
        series = pd.Series([h.count for h in history])
        
        # Forecast
        forecast = forecaster.fit_forecast(series, periods=forecast_periods)
        explanation = explainer.generate_explanation(forecast, series, skill)
        
        forecasts.append({
            'skill': skill,
            'forecast': forecast['forecast'],
            'explanation': explanation,
            'method': forecast.get('method', 'ensemble')
        })
        
        logger.info(f"Forecasted {skill}: {forecast['forecast'][:2]}")
    
    return forecasts

# ============================================
# USAGE EXAMPLE
# ============================================

if __name__ == "__main__":
    # Example time series
    np.random.seed(42)
    dates = pd.date_range('2023-01-01', periods=24, freq='M')
    values = np.array([100, 105, 110, 115, 120, 125, 140, 155, 170, 185, 
                       200, 215, 230, 245, 250, 255, 260, 265, 270, 275, 280, 285, 290, 295])
    series = pd.Series(values, index=dates)
    
    print("=" * 60)
    print("🔮 Forecasting Models - Comparison")
    print("=" * 60)
    
    # Ensemble forecast
    ensemble = EnsembleForecaster()
    result = ensemble.fit_forecast(series, periods=6)
    
    print(f"\n📊 Ensemble Forecast (next 6 months):")
    for i, val in enumerate(result['forecast'], 1):
        print(f"  Month {i}: {val} jobs")
    
    # Explanation
    explainer = ForecastExplainer()
    explanation = explainer.generate_explanation(result, series, "Python")
    
    print(f"\n💡 Explanation:")
    print(f"  Current: {explanation['current_value']}")
    print(f"  Forecast: {explanation['forecast_next_period']}")
    print(f"  Change: {explanation['change_percent']}")
    print(f"  Trend: {explanation['trend']}")
    print(f"  Recommendation: {explanation['recommendation']}")