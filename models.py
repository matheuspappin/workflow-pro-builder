"""
Workflow AI - Models SQLAlchemy
Sistema completo de gestão para estúdios de dança
"""

from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Date, Time, Float, Boolean, ForeignKey, Enum, JSON, Numeric
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from sqlalchemy.sql import func
import enum

Base = declarative_base()

# Enums
class UserRole(enum.Enum):
    ADMIN = "admin"
    PROFESSOR = "professor"
    ALUNO = "aluno"

class DanceLevel(enum.Enum):
    INICIANTE = "iniciante"
    INTERMEDIARIO = "intermediario"
    AVANCADO = "avancado"

class SessionStatus(enum.Enum):
    AGENDADA = "agendada"
    REALIZADA = "realizada"
    CANCELADA = "cancelada"
    REMARCADA = "remarcada"

class AttendanceStatus(enum.Enum):
    PRESENTE = "presente"
    FALTA = "falta"
    FALTA_JUSTIFICADA = "falta_justificada"
    REPOSICAO = "reposicao"

class PaymentStatus(enum.Enum):
    PENDENTE = "pendente"
    PAGO = "pago"
    ATRASADO = "atrasado"
    CANCELADO = "cancelado"

class DayOfWeek(enum.Enum):
    SEGUNDA = "segunda"
    TERCA = "terca"
    QUARTA = "quarta"
    QUINTA = "quinta"
    SEXTA = "sexta"
    SABADO = "sabado"
    DOMINGO = "domingo"

# Modelo base com timestamps
class BaseModel(Base):
    __abstract__ = True

    id = Column(Integer, primary_key=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

# Usuários com discriminator
class User(BaseModel):
    __tablename__ = 'users'

    # Discriminator
    role = Column(Enum(UserRole), nullable=False)

    # Campos comuns
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    phone = Column(String(20))
    birth_date = Column(Date)
    address = Column(Text)
    emergency_contact = Column(String(255))
    medical_info = Column(Text)

    # Medidas corporais (JSON)
    body_measurements = Column(JSON)

    # Campos específicos por role
    is_active = Column(Boolean, default=True)

    # Relacionamentos
    classes_as_teacher = relationship("Class", back_populates="teacher", foreign_keys="Class.teacher_id")
    sessions_as_teacher = relationship("Session", back_populates="actual_teacher", foreign_keys="Session.actual_teacher_id")
    attendances = relationship("Attendance", back_populates="student")
    finances_student = relationship("StudentFinance", back_populates="student")
    finances_teacher = relationship("TeacherFinance", back_populates="teacher")
    gamification = relationship("Gamification", back_populates="student")
    leads = relationship("LeadPipeline", back_populates="prospect")

    __mapper_args__ = {
        'polymorphic_on': role,
        'polymorphic_identity': None
    }

class Admin(User):
    __tablename__ = 'admins'
    __mapper_args__ = {
        'polymorphic_identity': UserRole.ADMIN
    }

    id = Column(Integer, ForeignKey('users.id'), primary_key=True)

class Professor(User):
    __tablename__ = 'professors'
    __mapper_args__ = {
        'polymorphic_identity': UserRole.PROFESSOR
    }

    id = Column(Integer, ForeignKey('users.id'), primary_key=True)

    # Campos específicos do professor
    hourly_rate = Column(Numeric(10, 2), default=0)
    specialties = Column(JSON)  # Lista de estilos de dança
    hire_date = Column(Date)
    is_available = Column(Boolean, default=True)

class Aluno(User):
    __tablename__ = 'alunos'
    __mapper_args__ = {
        'polymorphic_identity': UserRole.ALUNO
    }

    id = Column(Integer, ForeignKey('users.id'), primary_key=True)

    # Campos específicos do aluno
    enrollment_date = Column(Date)
    dance_level = Column(Enum(DanceLevel), default=DanceLevel.INICIANTE)
    has_trial_class = Column(Boolean, default=False)

# Salas
class Room(BaseModel):
    __tablename__ = 'rooms'

    name = Column(String(100), nullable=False)
    capacity = Column(Integer, nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)

    # Relacionamentos
    schedules = relationship("Schedule", back_populates="room")

# Turmas
class Class(BaseModel):
    __tablename__ = 'classes'

    name = Column(String(255), nullable=False)
    dance_style = Column(String(100), nullable=False)  # Ballet, Jazz, Hip Hop, etc.
    level = Column(Enum(DanceLevel), nullable=False)
    max_capacity = Column(Integer, nullable=False)
    current_students = Column(Integer, default=0)
    description = Column(Text)
    price_per_month = Column(Numeric(10, 2), nullable=False)
    teacher_id = Column(Integer, ForeignKey('professors.id'))
    is_active = Column(Boolean, default=True)

    # Relacionamentos
    teacher = relationship("Professor", back_populates="classes_as_teacher", foreign_keys=[teacher_id])
    schedules = relationship("Schedule", back_populates="class_ref")
    sessions = relationship("Session", back_populates="class_ref")
    enrollments = relationship("Enrollment", back_populates="class_ref")

# Grade Horária
class Schedule(BaseModel):
    __tablename__ = 'schedules'

    class_id = Column(Integer, ForeignKey('classes.id'), nullable=False)
    room_id = Column(Integer, ForeignKey('rooms.id'), nullable=False)
    day_of_week = Column(Enum(DayOfWeek), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)

    # Relacionamentos
    class_ref = relationship("Class", back_populates="schedules")
    room = relationship("Room", back_populates="schedules")

# Matrículas
class Enrollment(BaseModel):
    __tablename__ = 'enrollments'

    student_id = Column(Integer, ForeignKey('alunos.id'), nullable=False)
    class_id = Column(Integer, ForeignKey('classes.id'), nullable=False)
    enrollment_date = Column(Date, nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDENTE)
    discount_percentage = Column(Float, default=0)
    notes = Column(Text)

    # Relacionamentos
    student = relationship("Aluno", foreign_keys=[student_id])
    class_ref = relationship("Class", back_populates="enrollments")

# Aulas (Sessões)
class Session(BaseModel):
    __tablename__ = 'sessions'

    class_id = Column(Integer, ForeignKey('classes.id'), nullable=False)
    scheduled_date = Column(Date, nullable=False)
    actual_teacher_id = Column(Integer, ForeignKey('professors.id'))
    status = Column(Enum(SessionStatus), default=SessionStatus.AGENDADA)
    content_taught = Column(Text)  # Conteúdo ministrado
    notes = Column(Text)  # Observações da aula
    room_used = Column(String(100))  # Sala utilizada (pode ser diferente da agendada)
    attendance_count = Column(Integer, default=0)

    # Relacionamentos
    class_ref = relationship("Class", back_populates="sessions")
    actual_teacher = relationship("Professor", back_populates="sessions_as_teacher", foreign_keys=[actual_teacher_id])
    attendances = relationship("Attendance", back_populates="session")
    teacher_finances = relationship("TeacherFinance", back_populates="session")

# Presenças
class Attendance(BaseModel):
    __tablename__ = 'attendances'

    session_id = Column(Integer, ForeignKey('sessions.id'), nullable=False)
    student_id = Column(Integer, ForeignKey('alunos.id'), nullable=False)
    status = Column(Enum(AttendanceStatus), default=AttendanceStatus.FALTA)
    notes = Column(Text)  # Justificativa para falta ou observações
    check_in_time = Column(DateTime(timezone=True))
    check_out_time = Column(DateTime(timezone=True))

    # Relacionamentos
    session = relationship("Session", back_populates="attendances")
    student = relationship("Aluno", back_populates="attendances")

# Financeiro Professor
class TeacherFinance(BaseModel):
    __tablename__ = 'teacher_finances'

    session_id = Column(Integer, ForeignKey('sessions.id'), nullable=False)
    teacher_id = Column(Integer, ForeignKey('professors.id'), nullable=False)
    base_amount = Column(Numeric(10, 2), nullable=False)  # Valor base da aula
    student_count = Column(Integer, nullable=False)  # Número de alunos presentes
    bonus_amount = Column(Numeric(10, 2), default=0)  # Bônus por performance
    total_amount = Column(Numeric(10, 2), nullable=False)  # Valor total devido
    payment_date = Column(Date)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDENTE)
    notes = Column(Text)

    # Relacionamentos
    session = relationship("Session", back_populates="teacher_finances")
    teacher = relationship("Professor", back_populates="finances_teacher")

# Financeiro Aluno
class StudentFinance(BaseModel):
    __tablename__ = 'student_finances'

    student_id = Column(Integer, ForeignKey('alunos.id'), nullable=False)
    reference_month = Column(String(7), nullable=False)  # YYYY-MM
    tuition_fee = Column(Numeric(10, 2), nullable=False)  # Mensalidade
    costume_fee = Column(Numeric(10, 2), default=0)  # Taxa de figurino
    late_fee = Column(Numeric(10, 2), default=0)  # Multa por atraso
    discount_amount = Column(Numeric(10, 2), default=0)  # Descontos aplicados
    total_amount = Column(Numeric(10, 2), nullable=False)  # Valor total
    due_date = Column(Date, nullable=False)
    payment_date = Column(Date)
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDENTE)
    payment_method = Column(String(50))
    notes = Column(Text)

    # Relacionamentos
    student = relationship("Aluno", back_populates="finances_student")

# Gamification
class Gamification(BaseModel):
    __tablename__ = 'gamifications'

    student_id = Column(Integer, ForeignKey('alunos.id'), nullable=False)
    badge_name = Column(String(255), nullable=False)
    badge_description = Column(Text)
    badge_category = Column(String(100))  # Presença, Performance, Social, etc.
    points_earned = Column(Integer, default=0)
    achievement_date = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)

    # Relacionamentos
    student = relationship("Aluno", back_populates="gamification")

# Lead Pipeline
class LeadPipeline(BaseModel):
    __tablename__ = 'lead_pipelines'

    prospect_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # Pode ser um user não matriculado
    source = Column(String(100))  # Como soube do estúdio
    interest_level = Column(Integer, default=1)  # 1-5 escala de interesse
    trial_class_date = Column(Date)
    trial_class_feedback = Column(Text)
    follow_up_date = Column(Date)
    conversion_probability = Column(Float, default=0)  # 0-1
    converted_to_student = Column(Boolean, default=False)
    conversion_date = Column(Date)
    notes = Column(Text)

    # Relacionamentos
    prospect = relationship("User", back_populates="leads")

# Configurações do Estúdio
class StudioSettings(BaseModel):
    __tablename__ = 'studio_settings'

    setting_key = Column(String(100), unique=True, nullable=False)
    setting_value = Column(JSON, nullable=False)  # Armazenar valores complexos
    description = Column(Text)
    is_system_setting = Column(Boolean, default=False)  # Configurações que não devem ser alteradas pelo usuário

    # Método para obter configuração por chave
    @classmethod
    def get_setting(cls, session, key: str):
        setting = session.query(cls).filter_by(setting_key=key).first()
        return setting.setting_value if setting else None

    # Método para definir configuração
    @classmethod
    def set_setting(cls, session, key: str, value, description: str = ""):
        setting = session.query(cls).filter_by(setting_key=key).first()
        if setting:
            setting.setting_value = value
            setting.description = description
        else:
            setting = cls(
                setting_key=key,
                setting_value=value,
                description=description
            )
            session.add(setting)
        session.commit()
        return setting

# Configurações padrão do sistema (inseridas na criação do banco)
DEFAULT_SETTINGS = [
    {
        'setting_key': 'cancellation_deadline_hours',
        'setting_value': 24,  # Horas antes da aula para cancelar sem multa
        'description': 'Tempo limite para cancelamento de aula sem multa (horas)'
    },
    {
        'setting_key': 'late_fee_percentage',
        'setting_value': 2.0,  # Percentual da multa por atraso
        'description': 'Percentual da mensalidade cobrado como multa por atraso'
    },
    {
        'setting_key': 'max_absences_month',
        'setting_value': 3,  # Máximo de faltas por mês
        'description': 'Número máximo de faltas permitidas por mês antes de suspensão'
    },
    {
        'setting_key': 'trial_class_duration',
        'setting_value': 60,  # Duração da aula experimental em minutos
        'description': 'Duração da aula experimental em minutos'
    },
    {
        'setting_key': 'teacher_payment_rule',
        'setting_value': 'per_student',  # 'fixed' ou 'per_student'
        'description': 'Regra de pagamento dos professores: valor fixo ou por aluno presente'
    },
    {
        'setting_key': 'working_hours_start',
        'setting_value': '06:00',
        'description': 'Horário de início das operações'
    },
    {
        'setting_key': 'working_hours_end',
        'setting_value': '22:00',
        'description': 'Horário de fim das operações'
    }
]

# Função para criar todas as tabelas
def create_tables(engine):
    Base.metadata.create_all(engine)

# Função para popular configurações padrão
def populate_default_settings(session):
    for setting in DEFAULT_SETTINGS:
        existing = session.query(StudioSettings).filter_by(setting_key=setting['setting_key']).first()
        if not existing:
            new_setting = StudioSettings(
                setting_key=setting['setting_key'],
                setting_value=setting['setting_value'],
                description=setting['description'],
                is_system_setting=True
            )
            session.add(new_setting)
    session.commit()

# Exemplo de uso:
if __name__ == "__main__":
    # Configurar engine (exemplo com SQLite para desenvolvimento)
    engine = create_engine('sqlite:///danceflow.db', echo=True)

    # Criar tabelas
    create_tables(engine)

    # Criar sessão
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = SessionLocal()

    # Popular configurações padrão
    populate_default_settings(session)

    session.close()

    print("Banco de dados criado com sucesso!")
    print("Tabelas criadas:")
    for table in Base.metadata.sorted_tables:
        print(f"- {table.name}")