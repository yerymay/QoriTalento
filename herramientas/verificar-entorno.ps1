# Verificacion no destructiva para Windows PowerShell 5+ / PowerShell 7.
# No instala software ni modifica el proyecto.
$ErrorActionPreference = "Continue"
Write-Host "=== Qori Talento | Verificacion del entorno local ==="
$commands = @('git', 'node', 'npm', 'mysql', 'docker', 'ollama', 'python')
foreach ($name in $commands) {
  $found = Get-Command $name -ErrorAction SilentlyContinue
  if ($found) { Write-Host "[OK] $name: $($found.Source)" }
  else { Write-Host "[PENDIENTE/OPCIONAL] $name no encontrado en PATH" }
}
if (Get-Command node -ErrorAction SilentlyContinue) { Write-Host "Node: $(node --version)" }
if (Get-Command npm -ErrorAction SilentlyContinue) { Write-Host "npm: $(npm --version)" }
if (Get-Command ollama -ErrorAction SilentlyContinue) {
  Write-Host "Modelos Ollama instalados:";
  try { ollama list } catch { Write-Host "[AVISO] No se pudo consultar ollama list" }
}
try {
  $tags = Invoke-RestMethod -Uri 'http://127.0.0.1:11434/api/tags' -TimeoutSec 3 -ErrorAction Stop
  Write-Host '[OK] Ollama API responde localmente en 127.0.0.1:11434'
  $models = @($tags.models | ForEach-Object { $_.name })
  if ($models -contains 'qwen2.5:7b-instruct') { Write-Host '[OK] Modelo qwen2.5:7b-instruct disponible' }
  else { Write-Host '[AVISO] Modelo qwen2.5:7b-instruct no aparece en Ollama API' }
} catch { Write-Host '[AVISO] Ollama API no responde; inicia Ollama si deseas hacer pruebas de IA' }
Write-Host 'Esta prueba no verifica Express, Astro ni MySQL: aun no se ha instalado el proyecto.'
