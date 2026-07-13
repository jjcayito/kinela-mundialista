# Puntaje

Valores por defecto:

- Resultado en 90 minutos: 5 puntos.
- Clasificado: 3 puntos.
- Via de clasificacion: 2 puntos.
- Marcador exacto: 4 puntos.
- Diferencia de goles: 2 puntos.
- Goles exactos Equipo A: 1 punto.
- Goles exactos Equipo B: 1 punto.

La funcion `calculateMatchScore(prediction, officialResult, scoringRules)` es pura y testeable. Si el resultado no esta confirmado, devuelve cero puntos.

Regla principal: si el participante no acierta el clasificado oficial, ese partido suma 0 puntos. Esto evita que una apuesta por el equipo eliminado reciba puntos parciales por via, empate previo o marcador.

Para partidos decididos en suplementario, el marcador por goles si cuenta para marcador exacto, diferencia y goles por equipo. Para partidos decididos por penales, no se consideran goles de tanda; solo se consideran goles si el marcador apostado representa el empate del partido antes de la tanda.

Desempates:

1. Mayor puntaje total.
2. Mas marcadores exactos.
3. Mas clasificados acertados.
4. Mas vias acertadas.
5. Menos partidos sin responder.
6. Orden alfabetico.
