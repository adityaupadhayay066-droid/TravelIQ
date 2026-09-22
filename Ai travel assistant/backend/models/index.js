const sequelize = require('../config/db');

const User = require('./User');
const Trip = require('./Trip');
const Route = require('./Route');
const Booking = require('./Booking');
const Transport = require('./Transport');
const Analytics = require('./Analytics');
const Station = require('./Station');
const Session = require('./Session');
const OtpVerification = require('./OtpVerification');
const LoginHistory = require('./LoginHistory');
const CarbonEmission = require('./CarbonEmission');
const FoodRecommendation = require('./FoodRecommendation');
const AdminLog = require('./AdminLog');
const SecurityAlert = require('./SecurityAlert');
const RefreshToken = require('./RefreshToken');
const ChatbotKnowledge = require('./ChatbotKnowledge');
const ChatHistory = require('./ChatHistory');
const Train = require('./Train');
const TrainSchedule = require('./TrainSchedule');
const TrainFare = require('./TrainFare');
const Coupon = require('./Coupon');
const SearchAnalytics = require('./SearchAnalytics');
const FavoriteRoute = require('./FavoriteRoute');
const UserLoyalty = require('./UserLoyalty');
const UserSecurity = require('./UserSecurity');
const UserPasskey = require('./UserPasskey');
const Announcement = require('./Announcement');
const Transaction = require('./Transaction');
const PaymentLog = require('./PaymentLog');
const SupportTicket = require('./SupportTicket');
const SupportMessage = require('./SupportMessage');
const SupportAttachment = require('./SupportAttachment');
const LiveTrainStatus = require('./LiveTrainStatus');
const SosAlert = require('./SosAlert');
const AiPrediction = require('./AiPrediction');
const FareForecast = require('./FareForecast');
const DelayPrediction = require('./DelayPrediction');
const OccupancyPrediction = require('./OccupancyPrediction');
const CrowdPrediction = require('./CrowdPrediction');
const RecommendationLog = require('./RecommendationLog');
const ModelMetric = require('./ModelMetric');
const KnowledgeDocument = require('./KnowledgeDocument');
const DocumentChunk = require('./DocumentChunk');
const Embedding = require('./Embedding');
const AiQuery = require('./AiQuery');
const VoiceLog = require('./VoiceLog');
const StationModel = require('./StationModel');
const UserActivityLog = require('./UserActivityLog');
const Destination = require('./Destination');
const Report = require('./Report');
const AdminNotification = require('./AdminNotification');


// Relationships

// User has many Trips (1:N)
User.hasMany(Trip, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Trip.belongsTo(User, { foreignKey: 'user_id' });

// User has many Bookings (1:N)
User.hasMany(Booking, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Booking.belongsTo(User, { foreignKey: 'user_id' });

// User has one Analytics (1:1)
User.hasOne(Analytics, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Analytics.belongsTo(User, { foreignKey: 'user_id' });

// User has many Sessions (1:N)
User.hasMany(Session, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Session.belongsTo(User, { foreignKey: 'user_id' });

// User has many OTP Verifications (1:N)
User.hasMany(OtpVerification, { foreignKey: 'user_id', onDelete: 'CASCADE' });
OtpVerification.belongsTo(User, { foreignKey: 'user_id' });

// User has many Login Histories (1:N)
User.hasMany(LoginHistory, { foreignKey: 'user_id', onDelete: 'CASCADE' });
LoginHistory.belongsTo(User, { foreignKey: 'user_id' });

// User has many Carbon Emissions (1:N)
User.hasMany(CarbonEmission, { foreignKey: 'user_id', onDelete: 'CASCADE' });
CarbonEmission.belongsTo(User, { foreignKey: 'user_id' });

// Security and Auditing Relationships
User.hasMany(AdminLog, { foreignKey: 'admin_id', onDelete: 'CASCADE' });
AdminLog.belongsTo(User, { foreignKey: 'admin_id' });

User.hasMany(SecurityAlert, { foreignKey: 'user_id', onDelete: 'CASCADE' });
SecurityAlert.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(RefreshToken, { foreignKey: 'user_id', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(ChatHistory, { foreignKey: 'user_id', onDelete: 'CASCADE' });
ChatHistory.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(SosAlert, { foreignKey: 'user_id', onDelete: 'CASCADE' });
SosAlert.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(UserActivityLog, { foreignKey: 'user_id', onDelete: 'CASCADE' });
UserActivityLog.belongsTo(User, { foreignKey: 'user_id' });

// Trip has many Routes (1:N)
Trip.hasMany(Route, { foreignKey: 'trip_id', onDelete: 'CASCADE' });
Route.belongsTo(Trip, { foreignKey: 'trip_id' });

// Trip has one Booking (1:1)
Trip.hasOne(Booking, { foreignKey: 'trip_id', onDelete: 'CASCADE' });
Booking.belongsTo(Trip, { foreignKey: 'trip_id' });

// Trip has one Carbon Emission (1:1)
Trip.hasOne(CarbonEmission, { foreignKey: 'trip_id', onDelete: 'CASCADE' });
CarbonEmission.belongsTo(Trip, { foreignKey: 'trip_id' });

// Train Relationships
Train.hasMany(TrainSchedule, { foreignKey: 'train_number', sourceKey: 'train_number' });
TrainSchedule.belongsTo(Train, { foreignKey: 'train_number', targetKey: 'train_number' });

Train.hasOne(LiveTrainStatus, { foreignKey: 'train_number', sourceKey: 'train_number' });
LiveTrainStatus.belongsTo(Train, { foreignKey: 'train_number', targetKey: 'train_number' });

Train.hasMany(TrainFare, { foreignKey: 'train_number', sourceKey: 'train_number' });
TrainFare.belongsTo(Train, { foreignKey: 'train_number', targetKey: 'train_number' });

// Station and TrainSchedule Relationships
Station.hasMany(TrainSchedule, { foreignKey: 'station_code', sourceKey: 'station_code', constraints: false });
TrainSchedule.belongsTo(Station, { foreignKey: 'station_code', targetKey: 'station_code', constraints: false });

// Search Analytics Relationships
User.hasMany(SearchAnalytics, { foreignKey: 'user_id', onDelete: 'SET NULL' });
SearchAnalytics.belongsTo(User, { foreignKey: 'user_id' });

// User Favorite routes (1:N)
User.hasMany(FavoriteRoute, { foreignKey: 'user_id', onDelete: 'CASCADE' });
FavoriteRoute.belongsTo(User, { foreignKey: 'user_id' });

// User Loyalty profile (1:1)
User.hasOne(UserLoyalty, { foreignKey: 'user_id', onDelete: 'CASCADE' });
UserLoyalty.belongsTo(User, { foreignKey: 'user_id' });

// User Security profile (1:1)
User.hasOne(UserSecurity, { foreignKey: 'user_id', onDelete: 'CASCADE' });
UserSecurity.belongsTo(User, { foreignKey: 'user_id' });

// User Passkeys (1:N)
User.hasMany(UserPasskey, { foreignKey: 'user_id', onDelete: 'CASCADE' });
UserPasskey.belongsTo(User, { foreignKey: 'user_id' });

// User creates Announcements (1:N)
User.hasMany(Announcement, { foreignKey: 'created_by', onDelete: 'CASCADE' });
Announcement.belongsTo(User, { foreignKey: 'created_by' });

// Payment / Transaction Relationships
Booking.hasOne(Transaction, { foreignKey: 'booking_id', onDelete: 'CASCADE' });
Transaction.belongsTo(Booking, { foreignKey: 'booking_id' });

User.hasMany(Transaction, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Transaction.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(PaymentLog, { foreignKey: 'user_id', onDelete: 'CASCADE' });
PaymentLog.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(SupportTicket, { foreignKey: 'user_id', onDelete: 'CASCADE' });
SupportTicket.belongsTo(User, { foreignKey: 'user_id' });

SupportTicket.hasMany(SupportMessage, { foreignKey: 'ticket_id', onDelete: 'CASCADE' });
SupportMessage.belongsTo(SupportTicket, { foreignKey: 'ticket_id' });

SupportTicket.hasMany(SupportAttachment, { foreignKey: 'ticket_id', onDelete: 'CASCADE' });
SupportAttachment.belongsTo(SupportTicket, { foreignKey: 'ticket_id' });

// Add sender relationship for User side
User.hasMany(SupportMessage, { foreignKey: 'sender_id', constraints: false });
SupportMessage.belongsTo(User, { foreignKey: 'sender_id', constraints: false });

// AI Relationships
User.hasMany(AiPrediction, { foreignKey: 'user_id', onDelete: 'SET NULL' });
AiPrediction.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(RecommendationLog, { foreignKey: 'user_id', onDelete: 'SET NULL' });
RecommendationLog.belongsTo(User, { foreignKey: 'user_id' });

Station.hasMany(CrowdPrediction, { foreignKey: 'station_code', sourceKey: 'station_code', onDelete: 'CASCADE' });
CrowdPrediction.belongsTo(Station, { foreignKey: 'station_code', targetKey: 'station_code' });

// RAG and Voice Relationships
User.hasMany(AiQuery, { foreignKey: 'user_id', onDelete: 'SET NULL' });
AiQuery.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(VoiceLog, { foreignKey: 'user_id', onDelete: 'SET NULL' });
VoiceLog.belongsTo(User, { foreignKey: 'user_id' });

KnowledgeDocument.hasMany(DocumentChunk, { foreignKey: 'document_id', onDelete: 'CASCADE' });
DocumentChunk.belongsTo(KnowledgeDocument, { foreignKey: 'document_id' });

User.hasMany(Report, { foreignKey: 'user_id', onDelete: 'SET NULL' });
Report.belongsTo(User, { foreignKey: 'user_id' });

DocumentChunk.hasOne(Embedding, { foreignKey: 'chunk_id', onDelete: 'CASCADE' });
Embedding.belongsTo(DocumentChunk, { foreignKey: 'chunk_id' });

// Organization, API Key & B2B Usage telemetry
const Organization = require('./Organization');
const ApiKey = require('./ApiKey');
const ApiUsageLog = require('./ApiUsageLog');

User.hasMany(Organization, { foreignKey: 'owner_id', onDelete: 'CASCADE' });
Organization.belongsTo(User, { foreignKey: 'owner_id' });

Organization.hasMany(ApiKey, { foreignKey: 'org_id', onDelete: 'CASCADE' });
ApiKey.belongsTo(Organization, { foreignKey: 'org_id' });

Organization.hasMany(ApiUsageLog, { foreignKey: 'org_id', onDelete: 'CASCADE' });
ApiUsageLog.belongsTo(Organization, { foreignKey: 'org_id' });

ApiKey.hasMany(ApiUsageLog, { foreignKey: 'api_key_id', onDelete: 'SET NULL' });
ApiUsageLog.belongsTo(ApiKey, { foreignKey: 'api_key_id' });

module.exports = {
  sequelize,
  User,
  Trip,
  Route,
  Booking,
  Transport,
  Analytics,
  Station,
  Session,
  OtpVerification,
  LoginHistory,
  CarbonEmission,
  FoodRecommendation,
  AdminLog,
  SecurityAlert,
  RefreshToken,
  ChatbotKnowledge,
  ChatHistory,
  Train,
  TrainSchedule,
  TrainFare,
  Coupon,
  SearchAnalytics,
  FavoriteRoute,
  UserLoyalty,
  UserSecurity,
  UserPasskey,
  Announcement,
  Transaction,
  PaymentLog,
  SupportTicket,
  SupportMessage,
  SupportAttachment,
  LiveTrainStatus,
  SosAlert,
  AiPrediction,
  FareForecast,
  DelayPrediction,
  OccupancyPrediction,
  CrowdPrediction,
  RecommendationLog,
  ModelMetric,
  KnowledgeDocument,
  DocumentChunk,
  Embedding,
  AiQuery,
  VoiceLog,
  StationModel,
  UserActivityLog,
  Destination,
  Report,
  AdminNotification,
  Organization,
  ApiKey,
  ApiUsageLog
};

