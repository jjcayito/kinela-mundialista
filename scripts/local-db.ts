const action = process.argv[2] ?? "status";

if (action === "migrate") {
  console.log("Demo local: las tablas estan modeladas en memoria. Postgres/Supabase queda listo para la fase 2.");
} else if (action === "seed") {
  console.log("Demo local: seed disponible con 22 participantes, fases, octavos, predicciones y resultados demo.");
} else {
  console.log("Uso: npm run db:migrate o npm run db:seed");
}
