# Excel automatico de la kinela

La web publica ofrece el archivo `kinela_actualizada.xlsx` desde:

https://jjcayito.github.io/kinela-mundialista/kinela_actualizada.xlsx

## Como se actualiza

1. El juez completa la hoja `RESULTADOS` en Google Sheets.
2. GitHub Actions ejecuta el flujo `Actualizar Excel de kinela` cada 15 minutos.
3. El flujo lee las respuestas y resultados desde Google Sheets.
4. Se genera `docs/kinela_actualizada.xlsx`.
5. Si el archivo cambio, GitHub lo publica automaticamente en Pages.

Tambien se puede forzar la actualizacion desde GitHub:

1. Entrar al repositorio.
2. Abrir `Actions`.
3. Seleccionar `Actualizar Excel de kinela`.
4. Presionar `Run workflow`.

## Formato esperado de RESULTADOS

La hoja `RESULTADOS` debe tener estos encabezados:

```text
Partido | Marcador A | Marcador B | Metodo oficial | Clasificado oficial | Estado
```

Ejemplos:

```text
QF1 | 2 | 1 | 90 minutos | Francia | Finalizado
QF2 | 1 | 1 | Penales    | España  | Finalizado
```

Para partidos por penales, el marcador debe ser el resultado antes de la tanda. Si el partido quedo 1-1 y gano España por penales, se registra `1`, `1`, `Penales`, `España`, `Finalizado`.
