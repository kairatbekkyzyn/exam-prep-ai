import api from './client'

export const authAPI = {
  register:  (data: { email: string; name: string; password: string }) => api.post('/auth/register', data),
  verifyOtp: (data: { email: string; code: string })                   => api.post('/auth/verify-otp', data),
  resendOtp: (data: { email: string })                                 => api.post('/auth/resend-otp', data),
  login:     (data: { email: string; password: string })               => api.post('/auth/login', data),
  me:        ()                                                         => api.get('/auth/me'),
}

export const materialsAPI = {
  list:   ()                                                                => api.get('/materials/'),
  create: (data: { title: string; content: string; num_questions: number }) => api.post('/materials/', data),
  upload: (formData: FormData)                                              => api.post('/materials/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: number)                                                      => api.delete(`/materials/${id}`),
}

export const quizzesAPI = {
  next:   (materialId?: number, seenIds: number[] = []) =>
    api.get('/quizzes/next', { params: {
      ...(materialId ? { material_id: materialId } : {}),
      ...(seenIds.length > 0 ? { seen_ids: seenIds } : {})
    }}),
  answer: (data: { question_id: number; selected_answer: number }) => api.post('/quizzes/answer', data),
  badges: ()                                                        => api.get('/quizzes/badges'),
}

export const statsAPI = {
  get: () => api.get('/stats/'),
}