import { meufinClient } from '@/lib/api/meufin-client'

const BASE = '/api/v1/vehicles'

export type FuelType = 'gasolina' | 'etanol' | 'flex' | 'diesel' | 'eletrico' | 'hibrido'
export type VehicleStatus = 'active' | 'sold' | 'inactive'
export type MemberRole = 'owner' | 'driver'
export type AlertStatus = 'overdue' | 'due_soon' | 'ok' | 'unknown'

export type VehicleMember = {
  member_id: string
  role: MemberRole
}

export type Vehicle = {
  id: string
  nickname?: string | null
  make: string
  model: string
  year_manufacture: number
  year_model: number
  color?: string | null
  plate?: string | null
  fuel_type: FuelType
  fipe_vehicle_type: string
  fipe_code?: string | null
  fipe_brand_code?: string | null
  fipe_model_code?: string | null
  fipe_year_code?: string | null
  acquisition_date?: string | null
  acquisition_price?: number | null
  current_odometer: number
  status: VehicleStatus
  sold_at?: string | null
  sold_price?: number | null
  notes?: string | null
  members: VehicleMember[]
  created_at: string
  updated_at: string
}

export type VehicleInput = {
  nickname?: string | null
  make: string
  model: string
  year_manufacture: number
  year_model: number
  color?: string | null
  plate?: string | null
  fuel_type: string
  fipe_vehicle_type?: string
  fipe_code?: string | null
  fipe_brand_code?: string | null
  fipe_model_code?: string | null
  fipe_year_code?: string | null
  acquisition_date?: string | null
  acquisition_price?: number | null
  current_odometer: number
  notes?: string | null
  members?: VehicleMember[]
}

export type VehicleUpdateInput = VehicleInput & {
  status: string
  sold_at?: string | null
  sold_price?: number | null
}

export type Maintenance = {
  id: string
  vehicle_id: string
  template_id?: string | null
  type: string
  title: string
  description?: string | null
  odometer_at_service?: number | null
  service_date: string
  cost?: number | null
  supplier_id?: string | null
  next_service_odometer?: number | null
  next_service_date?: string | null
  notes?: string | null
  created_at: string
}

export type MaintenanceInput = {
  type: string
  title: string
  odometer_at_service?: number | null
  service_date: string
  cost?: number | null
  next_service_odometer?: number | null
  next_service_date?: string | null
  notes?: string | null
}

export type VehiclePlan = {
  id?: string
  template_id: string
  type: string
  name: string
  interval_km?: number | null
  interval_days?: number | null
  enabled: boolean
  is_customized: boolean
}

export type PlanUpdateInput = {
  interval_km?: number | null
  interval_days?: number | null
  enabled: boolean
}

export type MaintenanceAlert = {
  template_id: string
  type: string
  title: string
  status: AlertStatus
  due_at_km?: number | null
  due_at_date?: string | null
  km_remaining?: number | null
  days_remaining?: number | null
  last_odometer?: number | null
  last_date?: string | null
}

export type FipeHistoryPoint = {
  reference_month: string
  fipe_value: number
  fipe_fuel?: string | null
}

export type DepreciationReport = {
  acquisition_price?: number | null
  current_fipe_value?: number | null
  total_depreciation_pct?: number | null
  total_depreciation_r?: number | null
  months_owned: number
  monthly_avg_deprec_r?: number | null
  annual_avg_deprec_r?: number | null
  trend_6months_r?: number | null
  history: FipeHistoryPoint[]
}

export type Paginated<T> = { items: T[]; total: number }

// FIPE raw types (parallelum JSON field names)
export type FipeBrand = { codigo: string; nome: string }
export type FipeModel = { codigo: number; nome: string }
export type FipeYear = { codigo: string; nome: string }
export type FipePrice = {
  Valor: string
  Marca: string
  Modelo: string
  AnoModelo: number
  Combustivel: string
  CodigoFipe: string
  MesReferencia: string
  TipoVeiculo: number
  SiglaCombustivel: string
}

// ─── Vehicles ─────────────────────────────────────────────────────────────────

export async function listVehiclesPaged(params: {
  limit: number
  offset: number
  status?: string
}): Promise<Paginated<Vehicle>> {
  const { data } = await meufinClient.get<Paginated<Vehicle>>(BASE, { params })
  return data
}

export async function getVehicle(id: string): Promise<Vehicle> {
  const { data } = await meufinClient.get<Vehicle>(`${BASE}/${id}`)
  return data
}

export async function createVehicle(input: VehicleInput): Promise<Vehicle> {
  const { data } = await meufinClient.post<Vehicle>(BASE, input)
  return data
}

export async function updateVehicle(id: string, input: VehicleUpdateInput): Promise<Vehicle> {
  const { data } = await meufinClient.put<Vehicle>(`${BASE}/${id}`, input)
  return data
}

export async function deleteVehicle(id: string): Promise<void> {
  await meufinClient.delete(`${BASE}/${id}`)
}

export async function updateOdometer(id: string, odometer: number): Promise<Vehicle> {
  const { data } = await meufinClient.patch<Vehicle>(`${BASE}/${id}/odometer`, { odometer })
  return data
}

// ─── Maintenance ──────────────────────────────────────────────────────────────

export async function listMaintenance(vehicleId: string): Promise<Maintenance[]> {
  const { data } = await meufinClient.get<{ items: Maintenance[] }>(`${BASE}/${vehicleId}/maintenance`)
  return data.items
}

export async function createMaintenance(vehicleId: string, input: MaintenanceInput): Promise<Maintenance> {
  const { data } = await meufinClient.post<Maintenance>(`${BASE}/${vehicleId}/maintenance`, input)
  return data
}

export async function updateMaintenance(
  vehicleId: string,
  mainId: string,
  input: MaintenanceInput,
): Promise<Maintenance> {
  const { data } = await meufinClient.put<Maintenance>(`${BASE}/${vehicleId}/maintenance/${mainId}`, input)
  return data
}

export async function deleteMaintenance(vehicleId: string, mainId: string): Promise<void> {
  await meufinClient.delete(`${BASE}/${vehicleId}/maintenance/${mainId}`)
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export async function listVehiclePlans(vehicleId: string): Promise<VehiclePlan[]> {
  const { data } = await meufinClient.get<{ items: VehiclePlan[] }>(`${BASE}/${vehicleId}/plans`)
  return data.items
}

export async function updateVehiclePlan(
  vehicleId: string,
  templateId: string,
  input: PlanUpdateInput,
): Promise<VehiclePlan> {
  const { data } = await meufinClient.put<VehiclePlan>(`${BASE}/${vehicleId}/plans/${templateId}`, input)
  return data
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

export async function getVehicleAlerts(vehicleId: string): Promise<MaintenanceAlert[]> {
  const { data } = await meufinClient.get<{ items: MaintenanceAlert[] }>(`${BASE}/${vehicleId}/alerts`)
  return data.items
}

// ─── Depreciation & FIPE history ─────────────────────────────────────────────

export async function getDepreciation(vehicleId: string): Promise<DepreciationReport> {
  const { data } = await meufinClient.get<DepreciationReport>(`${BASE}/${vehicleId}/depreciation`)
  return data
}

export async function getFipeHistory(vehicleId: string): Promise<FipeHistoryPoint[]> {
  const { data } = await meufinClient.get<{ items: FipeHistoryPoint[] }>(`${BASE}/${vehicleId}/fipe-history`)
  return data.items
}

export async function getFipeAllYears(vehicleId: string): Promise<FipePrice[]> {
  const { data } = await meufinClient.get<FipePrice[]>(`${BASE}/${vehicleId}/fipe-all-years`)
  return data
}

// ─── FIPE search ──────────────────────────────────────────────────────────────

export async function listFipeBrands(vehicleType: string): Promise<FipeBrand[]> {
  const { data } = await meufinClient.get<FipeBrand[]>(`${BASE}/fipe/brands`, {
    params: { type: vehicleType },
  })
  return data
}

export async function listFipeModels(vehicleType: string, brandCode: string): Promise<FipeModel[]> {
  const { data } = await meufinClient.get<FipeModel[]>(`${BASE}/fipe/models`, {
    params: { type: vehicleType, brand_code: brandCode },
  })
  return data
}

export async function listFipeYears(
  vehicleType: string,
  brandCode: string,
  modelCode: string,
): Promise<FipeYear[]> {
  const { data } = await meufinClient.get<FipeYear[]>(`${BASE}/fipe/years`, {
    params: { type: vehicleType, brand_code: brandCode, model_code: modelCode },
  })
  return data
}

export async function getFipePrice(
  vehicleType: string,
  brandCode: string,
  modelCode: string,
  yearCode: string,
): Promise<FipePrice> {
  const { data } = await meufinClient.get<FipePrice>(`${BASE}/fipe/price`, {
    params: { type: vehicleType, brand_code: brandCode, model_code: modelCode, year_code: yearCode },
  })
  return data
}
