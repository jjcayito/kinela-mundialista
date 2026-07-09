# Excel automatico de la kinela

La web publica ofrece el archivo `kinela_actualizada.xlsx` desde:

https://jjcayito.github.io/kinela-mundialista/kinela_actualizada.xlsx

## Como se actualiza

1. Los participantes envian sus apuestas en Google Forms.
2. ESPN publica el resultado oficial del partido en su marcador de FIFA World Cup.
3. GitHub Actions ejecuta el flujo `Actualizar Excel de kinela` cada 10 minutos.
4. El flujo lee respuestas desde Google Sheets y resultados desde ESPN.
5. Se genera `docs/kinela_actualizada.xlsx`.
6. Si cambio algun resultado, GitHub publica automaticamente la nueva version en Pages.

Tambien se puede forzar la actualizacion desde GitHub:

1. Entrar al repositorio.
2. Abrir `Actions`.
3. Seleccionar `Actualizar Excel de kinela`.
4. Presionar `Run workflow`.

## Fuente de resultados

La fuente automatica es el marcador publico de ESPN para FIFA World Cup:

```text
https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard
```

Los partidos por penales se toman como marcador empatado y clasificado segun el ganador que marque ESPN. Los partidos por suplementario se identifican cuando ESPN publica el estado `AET` o `After Extra Time`.
