export interface IVehicleRevision {
  id: string;
  vehicleId: string;
  date: Date;
  km: number | null;
  description: string | null;
  files: string[];
  createdAt: Date;
  updatedAt: Date;
}
