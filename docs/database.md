# Base De Datos

## Tablas

- `participants`: id, name, code, active, role.
- `phases`: id, name, slug, status, opens_at, closes_at, order.
- `matches`: id, phase_id, order, team_a, team_b, starts_at, venue, api_provider, api_fixture_id, status, winner_source_match_id.
- `prediction_submissions`: id, participant_id, phase_id, submitted_at, validation_status, notes, is_counted.
- `predictions`: id, submission_id, participant_id, phase_id, match_id, team_a, team_b, goals_a_90, goals_b_90, predicted_qualifier, predicted_method, is_valid, validation_error.
- `match_results`: id, match_id, source, goals_a_90, goals_b_90, goals_a_extra, goals_b_extra, penalties_a, penalties_b, qualifier, method, confirmed, confirmed_by, confirmed_at, raw_payload_json.
- `scoring_rules`: id, key, label, points, active.
- `sync_logs`: id, ran_at, provider, status, message, touched_matches.

## Reglas de persistencia

La ultima submission valida antes del cierre debe marcar `is_counted=true`; las anteriores del mismo participante y fase quedan `false`.

Solo resultados confirmados deben alimentar puntajes.
