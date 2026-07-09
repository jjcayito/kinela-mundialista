import { syncDemoResults } from "../src/lib/store";

const result = syncDemoResults();
console.log(`Sincronizacion demo completada. Partidos tocados: ${result.touched}`);
