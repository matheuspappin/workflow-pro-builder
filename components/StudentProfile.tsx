import React from 'react'
import {
  Ruler,
  Trophy,
  Phone,
  Edit,
  UserX,
  Calendar,
  DollarSign,
  Star,
  Award,
  Target,
  Zap,
  Crown,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Save,
  X,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  LineChart,
} from 'recharts'

// Mock Data - Dados robustos para demonstração
const studentData = {
  id: '1',
  name: 'Ana Paula Rodrigues',
  age: 28,
  avatar: '/placeholder-user.jpg',
  status: 'active', // 'active' | 'overdue'
  joinDate: '2023-03-15',
  phone: '(11) 98888-1111',
  email: 'ana.paula@email.com',

  // Medidas corporais
  measurements: {
    bust: 88,
    waist: 68,
    hip: 95,
    height: 168,
    shoeSize: 38,
  },

  // Gamification - Conquistas
  achievements: [
    {
      id: 1,
      name: 'Estrela do Palco',
      description: 'Participou de 3 apresentações',
      icon: Star,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      unlockedAt: '2024-01-15',
    },
    {
      id: 2,
      name: 'Presença Perfeita',
      description: '100% de presença no último mês',
      icon: Award,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      unlockedAt: '2024-01-10',
    },
    {
      id: 3,
      name: '1 Ano de Casa',
      description: 'Completou 1 ano no estúdio',
      icon: Crown,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      unlockedAt: '2024-01-01',
    },
    {
      id: 4,
      name: 'Aluna Destaque',
      description: 'Melhor aluna do trimestre',
      icon: Trophy,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      unlockedAt: '2023-12-20',
    },
  ],

  // Turmas matriculadas
  enrolledClasses: [
    {
      id: 1,
      name: 'Turma de Nível 1',
      style: 'Geral',
      level: 'Intermediário',
      schedule: 'Terça e Quinta - 19h',
      teacher: 'Prof. Sofia',
      status: 'active',
    },
    {
      id: 2,
      name: 'Turma de Nível 2',
      style: 'Específico',
      level: 'Avançado',
      schedule: 'Sábado - 14h',
      teacher: 'Prof. Carla',
      status: 'active',
    },
  ],

  // Dados de presença (últimos 6 meses)
  attendanceData: [
    { month: 'Jul', attendance: 95, target: 100 },
    { month: 'Ago', attendance: 88, target: 100 },
    { month: 'Set', attendance: 92, target: 100 },
    { month: 'Out', attendance: 96, target: 100 },
    { month: 'Nov', attendance: 89, target: 100 },
    { month: 'Dez', attendance: 94, target: 100 },
  ],

  // Histórico financeiro (últimas 5 mensalidades)
  paymentHistory: [
    {
      month: 'Dezembro 2024',
      amount: 150.00,
      dueDate: '2024-12-10',
      paymentDate: '2024-12-08',
      status: 'pago',
    },
    {
      month: 'Novembro 2024',
      amount: 150.00,
      dueDate: '2024-11-10',
      paymentDate: '2024-11-15',
      status: 'pago',
    },
    {
      month: 'Outubro 2024',
      amount: 150.00,
      dueDate: '2024-10-10',
      paymentDate: '2024-10-12',
      status: 'pago',
    },
    {
      month: 'Setembro 2024',
      amount: 150.00,
      dueDate: '2024-09-10',
      paymentDate: null,
      status: 'pendente',
    },
    {
      month: 'Agosto 2024',
      amount: 150.00,
      dueDate: '2024-08-10',
      paymentDate: '2024-08-09',
      status: 'pago',
    },
  ],

  // Anotações pedagógicas
  notes: [
    {
      id: 1,
      teacher: 'Prof. Sofia',
      date: '2024-01-15',
      note: 'Melhorou significativamente a postura e o equilíbrio. Continua progredindo bem no nível intermediário.',
      type: 'positive',
    },
    {
      id: 2,
      teacher: 'Prof. Carla',
      date: '2024-01-12',
      note: 'Apresentou grande evolução nos movimentos técnicos. Recomendo foco nos detalhes para o próximo nível.',
      type: 'improvement',
    },
    {
      id: 3,
      teacher: 'Prof. Sofia',
      date: '2024-01-08',
      note: 'Faltou à aula sem justificativa. Entrar em contato para entender o motivo.',
      type: 'concern',
    },
    {
      id: 4,
      teacher: 'Prof. Carla',
      date: '2024-01-05',
      note: 'Excelente participação na aula prática. Demonstrou grande entusiasmo e dedicação.',
      type: 'positive',
    },
  ],
}

import { useOrganization } from '@/components/providers/organization-provider'

interface StudentProfileProps {
  studentData?: any
}

const StudentProfile = ({ studentData: propStudentData }: StudentProfileProps) => {
  const { vocabulary, t, niche, businessModel } = useOrganization()
  // Use dados passados por props ou dados mockados como fallback
  const data = propStudentData || studentData

  // Estados para modais
  const [editModalOpen, setEditModalOpen] = React.useState(false)
  const [absenceModalOpen, setAbsenceModalOpen] = React.useState(false)
  const [editFormData, setEditFormData] = React.useState({
    name: data.name,
    email: data.email,
    phone: data.phone,
    birthDate: '1995-01-01', // mock
    measurements: data.measurements
  })
  const [absenceFormData, setAbsenceFormData] = React.useState({
    date: new Date().toISOString().split('T')[0],
    reason: '',
    classId: data.enrolledClasses?.[0]?.id?.toString() || ''
  })

  // Handlers
  const handleWhatsApp = () => {
    const message = t.studentProfile.message
      .replace('{client}', data.name)
      .replace('{service}', vocabulary.service)
      .replace('{niche}', niche || 'dança')
    const whatsappUrl = `https://wa.me/${data.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleEditSave = () => {
    // Aqui seria a lógica para salvar no backend
    console.log('Salvando dados:', editFormData)
    setEditModalOpen(false)
    // toast de sucesso seria implementado
  }

  const handleRegisterAbsence = () => {
    // Aqui seria a lógica para registrar falta no backend
    console.log('Registrando falta:', absenceFormData)
    setAbsenceModalOpen(false)
    // toast de sucesso seria implementado
  }
  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3" />
        {t.studentProfile.active}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <AlertTriangle className="w-3 h-3" />
        {t.studentProfile.overdue}
      </span>
    )
  }

  const getPaymentStatusBadge = (status: string) => {
    return status === 'pago' ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3" />
        {t.studentProfile.paid}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        <AlertTriangle className="w-3 h-3" />
        {t.studentProfile.pending}
      </span>
    )
  }

  const getNoteTypeIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'improvement':
        return <TrendingUp className="w-4 h-4 text-blue-500" />
      case 'concern':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-fuchsia-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <img
                  src={data.avatar}
                  alt={data.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">
                    {data.name.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{data.name}</h1>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-lg text-gray-600">{data.age} {t.studentProfile.age}</span>
                  {getStatusBadge(data.status)}
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {t.studentProfile.clientSince.replace('{client}', vocabulary.client)} {new Date(data.joinDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleWhatsApp}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Phone className="w-4 h-4" />
                {t.studentProfile.whatsapp}
              </button>
              <button
                onClick={() => setEditModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <Edit className="w-4 h-4" />
                {t.studentProfile.editData}
              </button>
              <button
                onClick={() => setAbsenceModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-lg text-sm font-medium hover:from-violet-700 hover:to-fuchsia-700 transition-all"
              >
                <UserX className="w-4 h-4" />
                {t.studentProfile.registerAbsence}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Coluna Esquerda - Dados Físicos & Artísticos */}
          <div className="lg:col-span-2 space-y-6">

            {/* Card de Medidas (Apenas se nicho permitir - podemos refinar depois, mas vamos manter por enquanto) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-violet-100 to-fuchsia-100 rounded-lg flex items-center justify-center">
                  <Ruler className="w-5 h-5 text-violet-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t.studentProfile.measurements}</h3>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-violet-50 to-violet-100 rounded-lg border border-violet-200">
                  <div className="text-2xl font-bold text-violet-700">{data.measurements?.bust || 0}cm</div>
                  <div className="text-sm text-violet-600 font-medium">{t.studentProfile.bust}</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-fuchsia-50 to-fuchsia-100 rounded-lg border border-fuchsia-200">
                  <div className="text-2xl font-bold text-fuchsia-700">{data.measurements?.waist || 0}cm</div>
                  <div className="text-sm text-fuchsia-600 font-medium">{t.studentProfile.waist}</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg border border-pink-200">
                  <div className="text-2xl font-bold text-pink-700">{data.measurements?.hip || 0}cm</div>
                  <div className="text-sm text-pink-600 font-medium">{t.studentProfile.hip}</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
                  <div className="text-2xl font-bold text-indigo-700">{data.measurements?.height || 0}cm</div>
                  <div className="text-sm text-indigo-600 font-medium">{t.studentProfile.height}</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-700">{data.measurements?.shoeSize || 0}</div>
                  <div className="text-sm text-purple-600 font-medium">{t.studentProfile.shoeSize}</div>
                </div>
              </div>
            </div>

            {businessModel === 'CREDIT' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{t.studentProfile.achievements}</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.achievements?.map((achievement: any) => {
                    const IconComponent = typeof achievement.icon === 'string' ? Star : achievement.icon
                    return (
                      <div key={achievement.id} className={`p-4 rounded-lg border ${achievement.bgColor} border-opacity-20`}>
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg bg-white bg-opacity-50 flex items-center justify-center ${achievement.color}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{achievement.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                            <p className="text-xs text-gray-500 mt-2">
                            {t.studentProfile.achievedIn} {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Card de Turmas */}
            {(businessModel === 'CREDIT' || (data.enrolledClasses && data.enrolledClasses.length > 0)) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-100 to-teal-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {businessModel === 'CREDIT' ? t.studentProfile.enrolledClasses : t.studentProfile.recurringServices}
                  </h3>
                </div>

                <div className="space-y-4">
                  {data.enrolledClasses?.map((classItem: any) => (
                    <div key={classItem.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <h4 className="font-medium text-gray-900">{classItem.name}</h4>
                        <p className="text-sm text-gray-600">{classItem.style} - {classItem.level}</p>
                        <p className="text-sm text-gray-500">{classItem.schedule}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{classItem.teacher}</p>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3" />
                          {t.studentProfile.activeStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Coluna Direita - Administrativo */}
          <div className="space-y-6">

            {/* Gráfico de Presença */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t.studentProfile.frequency}</h3>
              </div>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                    <YAxis stroke="#6b7280" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                    />
                    <Bar
                      dataKey="attendance"
                      fill="url(#gradient)"
                      radius={[4, 4, 0, 0]}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#d946ef" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  {t.studentProfile.attendanceAverage}: <span className="font-semibold text-gray-900">
                    {Math.round(data.attendanceData.reduce((sum: number, item: { attendance: number }) => sum + item.attendance, 0) / data.attendanceData.length)}%
                  </span>
                </p>
              </div>
            </div>

            {/* Histórico Financeiro */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-100 to-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {businessModel === 'CREDIT' ? t.studentProfile.packageHistory : t.studentProfile.paymentHistory}
                  </h3>
              </div>

              <div className="space-y-3">
                {data.paymentHistory?.map((payment: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <p className="font-medium text-gray-900">{payment.month}</p>
                      <p className="text-sm text-gray-600">
                        {t.studentProfile.dueDate}: {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                      </p>
                      {payment.paymentDate && (
                        <p className="text-sm text-gray-600">
                          {t.studentProfile.paidIn}: {new Date(payment.paymentDate).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">R$ {Number(payment.amount).toFixed(2)}</p>
                      {getPaymentStatusBadge(payment.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Anotações Pedagógicas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{t.studentProfile.observations}</h3>
              </div>

              <div className="space-y-4 max-h-80 overflow-y-auto">
                {data.notes.map((note: { id: string; type: string; teacher?: string; date?: string; content?: string; note?: string }) => (
                  <div key={note.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-shrink-0">
                      {getNoteTypeIcon(note.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900">{note.teacher}</p>
                        <p className="text-xs text-gray-500">
                          {note.date ? new Date(note.date).toLocaleDateString('pt-BR') : '—'}
                        </p>
                      </div>
                      <p className="text-sm text-gray-700">{note.note}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.studentProfile.editDataTitle}</DialogTitle>
            <DialogDescription>
              {t.studentProfile.editDataDescription.replace('{client}', vocabulary.client)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t.studentProfile.fullName}</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">{t.studentProfile.email}</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">{t.studentProfile.phone}</Label>
              <Input
                id="edit-phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-birth-date">{t.studentProfile.birthDate}</Label>
              <Input
                id="edit-birth-date"
                type="date"
                value={editFormData.birthDate}
                onChange={(e) => setEditFormData({ ...editFormData, birthDate: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-bust">{t.studentProfile.bust} (cm)</Label>
                <Input
                  id="edit-bust"
                  type="number"
                  value={editFormData.measurements.bust}
                  onChange={(e) => setEditFormData({
                    ...editFormData,
                    measurements: { ...editFormData.measurements, bust: Number(e.target.value) }
                  })}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-waist">{t.studentProfile.waist} (cm)</Label>
                <Input
                  id="edit-waist"
                  type="number"
                  value={editFormData.measurements.waist}
                  onChange={(e) => setEditFormData({
                    ...editFormData,
                    measurements: { ...editFormData.measurements, waist: Number(e.target.value) }
                  })}
                  className="bg-background"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              {t.studentProfile.cancel}
            </Button>
            <Button onClick={handleEditSave} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
              <Save className="w-4 h-4" />
              {t.studentProfile.saveChanges}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Registrar Falta */}
      <Dialog open={absenceModalOpen} onOpenChange={setAbsenceModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.studentProfile.registerAbsenceTitle}</DialogTitle>
            <DialogDescription>
              {t.studentProfile.registerAbsenceDescription.replace('{client}', vocabulary.client).replace('{service}', vocabulary.service)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="absence-date">{t.studentProfile.absenceDate}</Label>
              <Input
                id="absence-date"
                type="date"
                value={absenceFormData.date}
                onChange={(e) => setAbsenceFormData({ ...absenceFormData, date: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="absence-class">{t.studentProfile.class.replace('{service}', vocabulary.service)}</Label>
              <select
                id="absence-class"
                value={absenceFormData.classId}
                onChange={(e) => setAbsenceFormData({ ...absenceFormData, classId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecione...</option>
                {data.enrolledClasses?.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.schedule}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="absence-reason">{t.studentProfile.absenceReason}</Label>
              <Textarea
                id="absence-reason"
                value={absenceFormData.reason}
                onChange={(e) => setAbsenceFormData({ ...absenceFormData, reason: e.target.value })}
                placeholder="Ex: Gripado, viagem, etc."
                className="bg-background"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAbsenceModalOpen(false)}>
              {t.studentProfile.cancel}
            </Button>
            <Button onClick={handleRegisterAbsence} className="bg-red-600 hover:bg-red-700 text-white gap-2">
              <AlertTriangle className="w-4 h-4" />
              {t.studentProfile.register}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StudentProfile