// POST /api/reword
export interface RewordRequest {
  text: string
}
export interface RewordResponse {
  reworded: string
}

export interface ApiErrorResponse {
  error: string
}
