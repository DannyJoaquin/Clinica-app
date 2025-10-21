param(
  [string]$Base = 'http://localhost:3001'
)

$ErrorActionPreference = 'Stop'
Write-Host "=== E2E START ($Base) ==="

function Json($obj) { return ($obj | ConvertTo-Json -Compress -Depth 5) }

# Health check
try {
  $h = Invoke-RestMethod -Uri ($Base + '/health') -Method Get -TimeoutSec 5
  if (-not $h.ok) { throw 'Health NOK' }
  Write-Host "Health OK"
} catch {
  Write-Error "Health check falló: $($_.Exception.Message)"; exit 1
}

# Login admin
$loginBody = Json @{ correo='admin@clinica.com'; contrasena='admin123' }
$login = Invoke-RestMethod -Uri ($Base + '/auth/login') -Method Post -ContentType 'application/json' -Body $loginBody
if (-not $login.access_token) { Write-Error 'Sin token'; exit 1 }
$headers = @{ Authorization = ('Bearer ' + $login.access_token) }
Write-Host "Login OK"

# Profile
$profile = Invoke-RestMethod -Uri ($Base + '/auth/profile') -Headers $headers
Write-Host ("Profile OK rol=" + $profile.rol)

# Registrar doctor (correo aleatorio)
$rand = Get-Random -Maximum 100000
$docBody = Json @{ nombre='Dr QA'; correo=("doctor.qa+${rand}@clinica.com"); contrasena='test123'; rol='doctor' }
$doc = Invoke-RestMethod -Uri ($Base + '/auth/register') -Method Post -ContentType 'application/json' -Body $docBody
Write-Host ("Doctor Id=" + $doc.id)

# Crear paciente
$pacBody = Json @{ nombreCompleto=("Paciente QA ${rand}"); fechaNacimiento='1990-01-01'; telefono='555-1000' }
$pac = Invoke-RestMethod -Uri ($Base + '/pacientes') -Method Post -Headers $headers -ContentType 'application/json' -Body $pacBody
Write-Host ("Paciente Id=" + $pac.id)

# Listar pacientes
$plist = Invoke-RestMethod -Uri ($Base + '/pacientes') -Method Get -Headers $headers
Write-Host ("Pacientes total=" + $plist.Count)

# Crear cita
$citaBody = Json @{ pacienteId=$pac.id; doctorId=$doc.id; fecha=(Get-Date).ToString('s') + 'Z'; hora='10:00'; motivoConsulta='Chequeo QA' }
$cita = Invoke-RestMethod -Uri ($Base + '/citas') -Method Post -Headers $headers -ContentType 'application/json' -Body $citaBody
Write-Host ("Cita Id=" + $cita.id)

# Actualizar cita (estado)
$upCitaBody = Json @{ estado='confirmada' }
$cita2 = Invoke-RestMethod -Uri ($Base + '/citas/' + $cita.id) -Method Put -Headers $headers -ContentType 'application/json' -Body $upCitaBody
Write-Host ("Cita estado=" + $cita2.estado)

# Crear receta
$recBody = Json @{ pacienteId=$pac.id; doctorId=$doc.id; medicamentos='Ibuprofeno 400mg'; instrucciones='Cada 8h' }
$rec = Invoke-RestMethod -Uri ($Base + '/recetas') -Method Post -Headers $headers -ContentType 'application/json' -Body $recBody
Write-Host ("Receta Id=" + $rec.id)

# Listar recetas por paciente
$rlist = Invoke-RestMethod -Uri ($Base + '/pacientes/' + $pac.id + '/recetas') -Method Get -Headers $headers
Write-Host ("Recetas paciente=" + $rlist.Count)

# Descargar PDF de receta (con fallback a mostrar error JSON)
$dest = Join-Path $env:TEMP ("receta-" + $rec.id + "-" + $rand + ".pdf")
try {
  Invoke-WebRequest -Uri ($Base + '/recetas/' + $rec.id + '/pdf') -Headers $headers -OutFile $dest -ErrorAction Stop
  if (-not (Test-Path $dest)) { Write-Error 'PDF no descargado'; exit 1 } else { Write-Host ("PDF OK " + $dest) }
} catch {
  Write-Warning "Fallo descarga PDF, leyendo mensaje..."
  try {
    $errJson = Invoke-RestMethod -Uri ($Base + '/recetas/' + $rec.id + '/pdf') -Headers $headers -Method Get
    Write-Error ("PDF error: " + ($errJson | ConvertTo-Json -Compress))
  } catch {
    Write-Error ("PDF error sin detalle: " + $_.Exception.Message)
  }
  exit 1
}

# Crear pago
$pagoBody = Json @{ pacienteId=$pac.id; citaId=$cita.id; monto=500.0; metodoPago='efectivo' }
$pago = Invoke-RestMethod -Uri ($Base + '/pagos') -Method Post -Headers $headers -ContentType 'application/json' -Body $pagoBody
Write-Host ("Pago Id=" + $pago.id)

# Listar pagos
$pagos = Invoke-RestMethod -Uri ($Base + '/pagos') -Method Get -Headers $headers
Write-Host ("Pagos total=" + $pagos.Count)

Write-Host "=== E2E OK ✅ ==="