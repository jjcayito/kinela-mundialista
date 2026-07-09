# Importacion Opcional Desde Google Forms/Sheets

El modo principal es el formulario propio en `/predict`.

Variables:

```env
FORM_INPUT_MODE=custom
GOOGLE_SHEETS_ID=
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
```

Si `FORM_INPUT_MODE=google_sheets`, el importador debe leer una hoja con columnas:

- participante_id
- codigo
- phase_id
- match_id
- goals_a_90
- goals_b_90
- predicted_qualifier
- predicted_method
- submitted_at

Cada fila debe normalizarse a `prediction_submissions` y `predictions`, aplicando las mismas validaciones del formulario propio.
