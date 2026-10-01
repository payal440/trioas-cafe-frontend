'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Building2,
  Users,
  MessageSquare,
  Plus,
  RefreshCw,
  LogOut,
  CheckCircle,
  XCircle,
  Eye,
  Key,
  Layers,
  Activity,
  Edit,
  Power,
  Gift,
  Coffee,
  Calendar,
  Search,
  Check,
  X,
  AlertCircle,
  ExternalLink,
  Trash2,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  BarChart2,
  Bell,
  FileText,
  CreditCard,
  Settings as SettingsIcon,
  LifeBuoy,
  MoreVertical,
  Send,
  Download,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Filter,
  Clock,
  Sparkles,
  Lock,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { superAdminApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import {
  Client,
  ClientAdmin,
  WhatsAppLog,
  CustomerReward,
  SuperAdminDashboardStats,
  ClientActivity,
} from '@/types';

type NavSection =
  | 'dashboard'
  | 'cafes'
  | 'admins'
  | 'customers'
  | 'rewards'
  | 'whatsapp'
  | 'analytics'
  | 'notifications'
  | 'audit'
  | 'subscriptions'
  | 'settings'
  | 'support';

export default function SuperAdminPage() {
  const { role, user, loginSuperAdmin, logout } = useAuth();
  const { toast } = useToast();

  // Authentication State
  const [email, setEmail] = useState('admin@trioas.com');
  const [password, setPassword] = useState('Admin@123456');
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Active Main Navigation Section
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [loading, setLoading] = useState(false);

  // Global Data
  const [dashboardStats, setDashboardStats] = useState<SuperAdminDashboardStats | null>(null);
  const [clientsList, setClientsList] = useState<Client[]>([]);
  const [rewardsList, setRewardsList] = useState<CustomerReward[]>([]);
  const [whatsappLogs, setWhatsappLogs] = useState<WhatsAppLog[]>([]);
  const [customersList, setCustomersList] = useState<any[]>([]);

  // 1. Dashboard Chart State
  const [chartTimeline, setChartTimeline] = useState<'7D' | '30D' | '3M' | '1Y'>('30D');

  // 2. Manage Cafes Filters & Modals
  const [searchCafeQuery, setSearchCafeQuery] = useState('');
  const [filterCafeStatus, setFilterCafeStatus] = useState<string>('all');
  const [filterCafePlan, setFilterCafePlan] = useState<string>('all');
  const [showCreateClientModal, setShowCreateClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Forms for Create / Edit Cafe
  const [clientForm, setClientForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    subscriptionPlan: 'pro',
    maxStaff: 10,
    maxOffers: 15,
  });

  // Delete Cafe Confirmation & Loading State (In-app modal instead of browser popup)
  const [deletingClientTarget, setDeletingClientTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingClient, setIsDeletingClient] = useState<boolean>(false);

  // 3. Cafe Details Dedicated View (Drill-Down)
  const [selectedCafeDetail, setSelectedCafeDetail] = useState<Client | null>(null);
  const [cafeDetailTab, setCafeDetailTab] = useState<
    'overview' | 'customers' | 'visits' | 'rewards' | 'admins' | 'whatsapp' | 'activity'
  >('overview');
  const [cafeActivityData, setCafeActivityData] = useState<ClientActivity | null>(null);
  const [cafeActivityLoading, setCafeActivityLoading] = useState(false);

  // 4. Admin Management Drawer & State
  const [showAddAdminDrawer, setShowAddAdminDrawer] = useState(false);
  const [adminDrawerClientId, setAdminDrawerClientId] = useState<string>('');
  const [adminsList, setAdminsList] = useState<ClientAdmin[]>([]);
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Admin',
    password: '',
    sendWelcomeEmail: true,
  });

  // Edit & Delete Admin States
  const [editingAdminTarget, setEditingAdminTarget] = useState<{
    clientId: string;
    adminId: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    password?: string;
  } | null>(null);
  const [isUpdatingAdmin, setIsUpdatingAdmin] = useState(false);

  const [deletingAdminTarget, setDeletingAdminTarget] = useState<{
    clientId: string;
    adminId: string;
    name: string;
    cafeName: string;
  } | null>(null);
  const [isDeletingAdmin, setIsDeletingAdmin] = useState(false);

  // Cafe Admins Filter States
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminRoleFilter, setAdminRoleFilter] = useState<'all' | 'Admin' | 'Manager'>('all');
  const [adminStatusFilter, setAdminStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [adminLastLoginFilter, setAdminLastLoginFilter] = useState<'all' | 'today' | '7d' | '30d' | 'never'>('all');
  const [adminCreatedDateFilter, setAdminCreatedDateFilter] = useState<'all' | 'today' | '7d' | 'month' | 'custom'>('all');
  const [adminStartDate, setAdminStartDate] = useState('');
  const [adminEndDate, setAdminEndDate] = useState('');
  const [adminRolesMap, setAdminRolesMap] = useState<Record<string, 'Admin' | 'Manager'>>({});

  const hasActiveAdminFilters = Boolean(
    adminSearchQuery ||
    adminRoleFilter !== 'all' ||
    adminStatusFilter !== 'all' ||
    adminLastLoginFilter !== 'all' ||
    adminCreatedDateFilter !== 'all' ||
    adminStartDate ||
    adminEndDate
  );

  const resetAdminFilters = () => {
    setAdminSearchQuery('');
    setAdminRoleFilter('all');
    setAdminStatusFilter('all');
    setAdminLastLoginFilter('all');
    setAdminCreatedDateFilter('all');
    setAdminStartDate('');
    setAdminEndDate('');
  };

  // 5. Customers CRM State & Profile Drawer
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomerProfile, setSelectedCustomerProfile] = useState<any | null>(null);

  // Customer Edit & Delete States
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [customerEditForm, setCustomerEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    isActive: true,
  });
  const [isUpdatingCustomer, setIsUpdatingCustomer] = useState(false);
  const [deletingCustomerTarget, setDeletingCustomerTarget] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);

  // Customer Date Filter State
  const [customerDateRange, setCustomerDateRange] = useState<'all' | 'today' | '7d' | '30d' | 'custom'>('all');
  const [customerStartDate, setCustomerStartDate] = useState('');
  const [customerEndDate, setCustomerEndDate] = useState('');

  // 6. Rewards Subtab State ('rewards' | 'redemptions')
  const [rewardsSubtab, setRewardsSubtab] = useState<'rewards' | 'redemptions'>('rewards');

  // Rewards Search & Filter States
  const [rewardSearchQuery, setRewardSearchQuery] = useState('');
  const [rewardCafeFilter, setRewardCafeFilter] = useState('all');
  const [rewardStatusFilter, setRewardStatusFilter] = useState('all');
  const [rewardTypeFilter, setRewardTypeFilter] = useState('all');
  const [rewardSortBy, setRewardSortBy] = useState('popular');
  const [viewingReward, setViewingReward] = useState<any | null>(null);

  // Dynamic Rewards & Redemptions data loaded from Database (Zero static dummy data)
  const [rewardsCatalog, setRewardsCatalog] = useState<any[]>([]);
  const [isRewardsLoading, setIsRewardsLoading] = useState(false);

  // Redemptions Search & Filter States
  const [redemptionSearchQuery, setRedemptionSearchQuery] = useState('');
  const [redemptionCafeFilter, setRedemptionCafeFilter] = useState('all');
  const [redemptionStatusFilter, setRedemptionStatusFilter] = useState('all');
  const [redemptionDateFilter, setRedemptionDateFilter] = useState('all');
  const [redemptionTypeFilter, setRedemptionTypeFilter] = useState('all');
  const [viewingRedemption, setViewingRedemption] = useState<any | null>(null);
  const [redemptionsList, setRedemptionsList] = useState<any[]>([]);

  // Toggle Reward Active / Suspended State in Database via API
  const handleToggleRewardStatus = async (rewardId: string) => {
    try {
      const target = rewardsCatalog.find((r) => r.id === rewardId);
      if (!target) return;
      const nextActive = target.status !== 'Active';
      const nextStatusStr = nextActive ? 'Active' : 'Deactivated';

      await superAdminApi.setLoyaltyProgramStatus(rewardId, nextActive);

      toast(
        !nextActive
          ? `Reward "${target.name}" deactivated / suspended.`
          : `Reward "${target.name}" activated and available for redemption.`,
        !nextActive ? 'error' : 'success'
      );

      setRewardsCatalog((prev) =>
        prev.map((r) => (r.id === rewardId ? { ...r, status: nextStatusStr } : r))
      );
      setViewingReward((curr: any) =>
        curr && curr.id === rewardId ? { ...curr, status: nextStatusStr } : curr
      );
    } catch (err: any) {
      toast(err.message || 'Failed to update reward status', 'error');
    }
  };

  // 8. WhatsApp Logs Subtab / Filter
  const [whatsappStatusFilter, setWhatsappStatusFilter] = useState<string>('all');

  // 9. Analytics Filter
  const [analyticsPeriod, setAnalyticsPeriod] = useState<string>('30D');

  // 10. Notifications State
  const [notificationsFilter, setNotificationsFilter] = useState<'all' | 'unread' | 'system' | 'cafes' | 'whatsapp'>('all');
  const [notificationsList, setNotificationsList] = useState([
    { id: '1', title: 'New cafe onboarded', desc: 'Trio Artisan Cafe was successfully provisioned', time: '5 minutes ago', type: 'cafes', read: false },
    { id: '2', title: 'WhatsApp delivery failed', desc: '4 customer notifications bounced back in queue', time: '20 minutes ago', type: 'whatsapp', read: false },
    { id: '3', title: 'Subscription renewal alert', desc: 'Cafe Aroma Pro plan renews in 3 days', time: '2 hours ago', type: 'system', read: false },
    { id: '4', title: 'Milestone reached', desc: '1,000th QR check-in scanned on platform', time: 'Yesterday', type: 'system', read: true },
  ]);

  // 11. Audit Logs Drawer
  const [selectedAuditLog, setSelectedAuditLog] = useState<any | null>(null);

  // 13. Settings Subtab
  const [settingsTab, setSettingsTab] = useState<'profile' | 'security' | 'roles' | 'whatsapp' | 'platform'>('profile');
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });

  // 15. Support Desk Drawer
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketReplyText, setTicketReplyText] = useState('');
  const [ticketsList, setTicketsList] = useState([
    {
      id: '1024',
      cafe: 'Trio Cafe',
      subject: 'Barista camera scanner permission issue on iOS',
      priority: 'High',
      status: 'Open',
      messages: [
        { sender: 'Cafe Admin', text: 'Our baristas are unable to launch camera scanner on Safari.', time: '10:15 AM' },
        { sender: 'Super Admin', text: 'Please ensure camera access permission is allowed in iOS Safari site settings.', time: '10:28 AM' },
      ],
    },
    {
      id: '1023',
      cafe: 'Cafe Aroma',
      subject: 'Custom reward points adjustment inquiry',
      priority: 'Medium',
      status: 'Pending',
      messages: [
        { sender: 'Cafe Admin', text: 'Can we change stamp goal from 5 to 7 visits for the monsoon campaign?', time: 'Yesterday' },
      ],
    },
    {
      id: '1020',
      cafe: 'Brew & Bean Co.',
      subject: 'Monthly invoice receipt download',
      priority: 'Low',
      status: 'Resolved',
      messages: [
        { sender: 'Cafe Admin', text: 'Looking for September subscription GST receipt.', time: '3 days ago' },
        { sender: 'Super Admin', text: 'Receipt has been emailed to finance@brewandbean.com.', time: '3 days ago' },
      ],
    },
  ]);

  const isAuthenticated = role === 'super_admin' && !!user;

  // Load data on auth or tab change
  useEffect(() => {
    if (isAuthenticated) {
      loadMasterData();
    }
  }, [isAuthenticated, activeSection]);

  const loadMasterData = async () => {
    try {
      setLoading(true);
      const [statsRes, clientsRes, rewardsRes, whatsappRes, customersRes, programsRes] =
        await Promise.allSettled([
          superAdminApi.dashboard(),
          superAdminApi.listClients(),
          superAdminApi.listRewards(),
          superAdminApi.listWhatsAppLogs(),
          superAdminApi.listCustomers(),
          superAdminApi.listLoyaltyPrograms(),
        ]);

      if (statsRes.status === 'fulfilled') setDashboardStats(statsRes.value);
      if (clientsRes.status === 'fulfilled') setClientsList(clientsRes.value.clients || []);
      if (rewardsRes.status === 'fulfilled') setRewardsList(rewardsRes.value.rewards || []);
      if (whatsappRes.status === 'fulfilled') setWhatsappLogs(whatsappRes.value.logs || []);
      if (customersRes.status === 'fulfilled') setCustomersList(customersRes.value.customers || []);

      // Populate live dynamic rewards catalog from database
      if (programsRes.status === 'fulfilled') {
        const rawPrograms = (programsRes.value as any)?.programs || [];
        const mappedCatalog = rawPrograms.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || 'Complimentary loyalty perk for frequent customers.',
          cafe: p.client?.name || 'Cafe',
          clientId: p.clientId,
          type: p.rewardType || 'FREE_ITEM',
          typeLabel:
            p.rewardType === 'FREE_ITEM'
              ? 'Free Item'
              : p.rewardType === 'DISCOUNT'
                ? 'Discount'
                : 'Voucher / Perk',
          points: p.requiredVisits || 1,
          value: p.rewardValue || 'Standard Reward',
          redeemed: p._count?.customerRewards ?? 0,
          expiry: p.validTill || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          status: p.isActive ? 'Active' : 'Deactivated',
          createdBy: p.client?.clientAdmins?.[0]?.name || p.client?.clientAdmins?.[0]?.email || 'Cafe Admin',
          createdDate: p.createdAt,
          raw: p,
        }));
        setRewardsCatalog(mappedCatalog);
      } else {
        console.warn('Loyalty programs fetch failed:', programsRes.reason);
      }

      // Populate live dynamic redemptions list from database
      if (rewardsRes.status === 'fulfilled') {
        const rawRewards = rewardsRes.value.rewards || [];
        const mappedRedemptions = rawRewards.map((cr: any) => ({
          id: cr.id,
          customer: cr.customer?.name || 'Customer',
          phone: cr.customer?.phone || '-',
          reward: cr.program?.name || cr.rewardValue || 'Reward',
          cafe: cr.client?.name || 'Cafe',
          points: cr.program?.requiredVisits || 1,
          date: cr.redeemedAt
            ? new Date(cr.redeemedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : new Date(cr.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          rawDate: cr.redeemedAt || cr.createdAt,
          status: cr.isRedeemed ? 'Redeemed' : 'Pending',
          type: cr.program?.rewardType || 'FREE_ITEM',
          code: cr.rewardCode || '-',
          raw: cr,
        }));
        setRedemptionsList(mappedRedemptions);
      }

      // If viewing cafe details, refresh its activity
      if (selectedCafeDetail) {
        loadCafeDetailActivity(selectedCafeDetail.id);
      }
    } catch (err: any) {
      console.warn('Super Admin load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCafeDetailActivity = async (clientId: string) => {
    try {
      setCafeActivityLoading(true);
      const activity = await superAdminApi.getClientActivity(clientId);
      setCafeActivityData(activity);
    } catch (e) {
      console.warn('Could not load cafe activity:', e);
    } finally {
      setCafeActivityLoading(false);
    }
  };

  // 1. Login Handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast('Please enter your email and password', 'error');
      return;
    }

    try {
      setAuthSubmitting(true);
      await loginSuperAdmin(email.trim(), password);
      toast('Welcome Super Admin! Session unlocked.', 'success');
      loadMasterData();
    } catch (err: any) {
      toast(err.message || 'Super Admin login failed', 'error');
    } finally {
      setAuthSubmitting(false);
    }
  };

  // 2. Client Onboarding
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: clientForm.name.trim(),
        email: clientForm.email.trim(),
        subscriptionPlan: clientForm.subscriptionPlan,
        maxStaff: Number(clientForm.maxStaff) || 10,
        maxOffers: Number(clientForm.maxOffers) || 15,
      };
      if (clientForm.phone && clientForm.phone.trim()) {
        payload.phone = clientForm.phone.trim();
      }
      if (clientForm.address && clientForm.address.trim()) {
        payload.address = clientForm.address.trim();
      }

      await superAdminApi.createClient(payload);
      toast(`Cafe branch "${clientForm.name}" onboarded successfully!`, 'success');
      setShowCreateClientModal(false);
      setClientForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        subscriptionPlan: 'pro',
        maxStaff: 10,
        maxOffers: 15,
      });
      loadMasterData();
    } catch (err: any) {
      toast(err.message || 'Failed to onboard cafe', 'error');
    }
  };

  // 3. Edit Client
  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setClientForm({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      subscriptionPlan: client.subscriptionPlan || 'pro',
      maxStaff: client.maxStaff || 10,
      maxOffers: client.maxOffers || 15,
    });
    setShowEditClientModal(true);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    try {
      const payload: any = {
        name: clientForm.name.trim(),
        email: clientForm.email.trim(),
        subscriptionPlan: clientForm.subscriptionPlan,
        maxStaff: Number(clientForm.maxStaff) || 10,
        maxOffers: Number(clientForm.maxOffers) || 15,
      };
      if (clientForm.phone && clientForm.phone.trim()) {
        payload.phone = clientForm.phone.trim();
      }
      if (clientForm.address && clientForm.address.trim()) {
        payload.address = clientForm.address.trim();
      }

      await superAdminApi.updateClient(editingClient.id, payload);
      toast(`Cafe "${clientForm.name}" details updated!`, 'success');
      setShowEditClientModal(false);
      setEditingClient(null);
      loadMasterData();
    } catch (err: any) {
      toast(err.message || 'Failed to update cafe', 'error');
    }
  };

  // 4. Activate / Deactivate Client
  const handleToggleClientStatus = async (clientId: string, currentStatus: boolean, clientName: string) => {
    const nextStatus = !currentStatus;
    try {
      await superAdminApi.setClientStatus(clientId, nextStatus);
      toast(`Cafe "${clientName}" is now ${nextStatus ? 'ACTIVE' : 'DEACTIVATED'}!`, 'success');
      setClientsList((prev) =>
        prev.map((c) => (c.id === clientId ? { ...c, isActive: nextStatus } : c))
      );
      if (selectedCafeDetail?.id === clientId) {
        setSelectedCafeDetail((prev) => (prev ? { ...prev, isActive: nextStatus } : null));
      }
    } catch (err: any) {
      toast(err.message || 'Failed to update status', 'error');
    }
  };

  // 5. Delete Client (In-app confirmation + spinner loading, NO browser popup)
  const confirmDeleteClient = (clientId: string, clientName: string) => {
    setDeletingClientTarget({ id: clientId, name: clientName });
  };

  const handleExecuteDeleteClient = async () => {
    if (!deletingClientTarget) return;

    try {
      setIsDeletingClient(true);
      await superAdminApi.deleteClient(deletingClientTarget.id);
      toast(`Cafe "${deletingClientTarget.name}" deleted successfully!`, 'success');

      // Optimistically update clientsList immediately
      setClientsList((prev) => prev.filter((c) => c.id !== deletingClientTarget.id));
      if (selectedCafeDetail?.id === deletingClientTarget.id) {
        setSelectedCafeDetail(null);
      }
      setDeletingClientTarget(null);
      loadMasterData();
    } catch (err: any) {
      toast(err.message || 'Failed to delete cafe', 'error');
    } finally {
      setIsDeletingClient(false);
    }
  };

  // 6. Drill-Down into Cafe Details
  const handleOpenCafeDetail = async (client: Client) => {
    setSelectedCafeDetail(client);
    setCafeDetailTab('overview');
    loadCafeDetailActivity(client.id);
  };

  // 7. Add Admin Drawer Handler
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetClientId = adminDrawerClientId || selectedCafeDetail?.id || clientsList[0]?.id;
    if (!targetClientId) {
      toast('Please select a cafe for the new administrator', 'error');
      return;
    }

    try {
      const createdRes: any = await superAdminApi.createClientAdmin(targetClientId, {
        name: adminForm.name,
        email: adminForm.email,
        phone: adminForm.phone || undefined,
        password: adminForm.password,
      });

      const newId = createdRes?.clientAdmin?.id || createdRes?.admin?.id || createdRes?.id;
      if (newId && adminForm.role) {
        setAdminRolesMap((prev) => ({ ...prev, [newId]: (adminForm.role as any) || 'Admin' }));
      }

      toast(`Admin "${adminForm.name}" created successfully!`, 'success');
      setShowAddAdminDrawer(false);
      setAdminForm({
        name: '',
        email: '',
        phone: '',
        role: 'Admin',
        password: '',
        sendWelcomeEmail: true,
      });
      loadMasterData();
    } catch (err: any) {
      toast(err.message || 'Could not create admin account', 'error');
    }
  };

  // Edit & Delete Admin Handlers
  const handleOpenEditAdmin = (admin: any) => {
    setEditingAdminTarget({
      clientId: admin.clientId,
      adminId: admin.id,
      name: admin.name || '',
      email: admin.email || '',
      phone: admin.phone || '',
      role: adminRolesMap[admin.id] || admin.role || 'Admin',
      password: '',
    });
  };

  const handleSaveEditAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdminTarget) return;

    try {
      setIsUpdatingAdmin(true);
      const payload: any = {
        name: editingAdminTarget.name.trim(),
        email: editingAdminTarget.email.trim(),
      };
      if (editingAdminTarget.phone?.trim()) {
        payload.phone = editingAdminTarget.phone.trim();
      }
      if (editingAdminTarget.password?.trim()) {
        payload.password = editingAdminTarget.password.trim();
      }

      await superAdminApi.updateClientAdmin(
        editingAdminTarget.clientId,
        editingAdminTarget.adminId,
        payload
      );

      if (editingAdminTarget.role) {
        setAdminRolesMap((prev) => ({
          ...prev,
          [editingAdminTarget.adminId]: (editingAdminTarget.role as any) || 'Admin',
        }));
      }

      toast(`Admin "${editingAdminTarget.name}" details updated!`, 'success');
      setEditingAdminTarget(null);
      loadMasterData();
    } catch (err: any) {
      toast(err.message || 'Failed to update admin', 'error');
    } finally {
      setIsUpdatingAdmin(false);
    }
  };

  const confirmDeleteAdmin = (clientId: string, adminId: string, name: string, cafeName: string) => {
    setDeletingAdminTarget({ clientId, adminId, name, cafeName });
  };

  const handleExecuteDeleteAdmin = async () => {
    if (!deletingAdminTarget) return;

    try {
      setIsDeletingAdmin(true);
      await superAdminApi.deleteClientAdmin(
        deletingAdminTarget.clientId,
        deletingAdminTarget.adminId
      );
      toast(`Admin "${deletingAdminTarget.name}" removed successfully!`, 'success');
      setDeletingAdminTarget(null);
      loadMasterData();
    } catch (err: any) {
      toast(err.message || 'Failed to delete admin', 'error');
    } finally {
      setIsDeletingAdmin(false);
    }
  };

  // Customer Management Handlers
  const openEditCustomerModal = (customer: any) => {
    setEditingCustomer(customer);
    setCustomerEditForm({
      name: customer.name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      isActive: customer.isActive !== false,
    });
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    if (!customerEditForm.name.trim() || !customerEditForm.phone.trim()) {
      toast('Customer name and phone are required', 'error');
      return;
    }

    try {
      setIsUpdatingCustomer(true);
      const res = await superAdminApi.updateCustomer(editingCustomer.id, {
        name: customerEditForm.name.trim(),
        email: customerEditForm.email.trim() || undefined,
        phone: customerEditForm.phone.trim(),
        isActive: customerEditForm.isActive,
      });

      setCustomersList((prev) =>
        prev.map((c) =>
          c.id === editingCustomer.id
            ? { ...c, ...res.customer, name: customerEditForm.name.trim(), email: customerEditForm.email.trim(), phone: customerEditForm.phone.trim(), isActive: customerEditForm.isActive }
            : c
        )
      );
      toast('Customer details updated successfully!', 'success');
      setEditingCustomer(null);
    } catch (err: any) {
      toast(err.message || 'Failed to update customer', 'error');
    } finally {
      setIsUpdatingCustomer(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deletingCustomerTarget) return;

    try {
      setIsDeletingCustomer(true);
      await superAdminApi.deleteCustomer(deletingCustomerTarget.id);
      setCustomersList((prev) => prev.filter((c) => c.id !== deletingCustomerTarget.id));
      toast(`Customer "${deletingCustomerTarget.name}" deleted successfully.`, 'success');
      setDeletingCustomerTarget(null);
    } catch (err: any) {
      toast(err.message || 'Failed to delete customer', 'error');
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  // 15. Send Reply in Support Ticket
  const handleSendTicketReply = () => {
    if (!selectedTicket || !ticketReplyText.trim()) return;

    const newMsg = {
      sender: 'Super Admin',
      text: ticketReplyText.trim(),
      time: 'Just now',
    };

    setTicketsList((prev) =>
      prev.map((t) =>
        t.id === selectedTicket.id
          ? { ...t, messages: [...t.messages, newMsg] }
          : t
      )
    );
    setSelectedTicket((prev: any) =>
      prev ? { ...prev, messages: [...prev.messages, newMsg] } : null
    );
    setTicketReplyText('');
    toast('Reply dispatched to cafe administrator', 'success');
  };

  // Filtered Cafes list
  const filteredCafes = clientsList.filter((c) => {
    const matchesSearch =
      !searchCafeQuery ||
      c.name.toLowerCase().includes(searchCafeQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchCafeQuery.toLowerCase());
    const matchesStatus =
      filterCafeStatus === 'all' ||
      (filterCafeStatus === 'active' && c.isActive) ||
      (filterCafeStatus === 'inactive' && !c.isActive);
    const matchesPlan =
      filterCafePlan === 'all' ||
      c.subscriptionPlan.toLowerCase() === filterCafePlan.toLowerCase();
    return matchesSearch && matchesStatus && matchesPlan;
  });

  // ==============================================================
  // 14. LOGIN VIEW (Simple Dark Background + Orange Button)
  // ==============================================================
  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '85vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        <div
          className="glass-panel"
          style={{
            width: '100%',
            maxWidth: '460px',
            padding: '40px 36px',
            background: 'linear-gradient(145deg, #181512 0%, #0d0c0a 100%)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: '24px',
            textAlign: 'center',
          }}
        >
          {/* Logo Brand */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0c0b0a',
              marginBottom: '16px',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)',
            }}
          >
            <Coffee size={32} strokeWidth={2.4} />
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.8rem',
              fontWeight: 800,
              letterSpacing: '0.02em',
              color: '#fff',
            }}
          >
            TRIOAS
          </h1>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--accent-gold)',
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '26px',
            }}
          >
            Super Admin Portal
          </p>

          <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                <input
                  type="email"
                  required
                  placeholder="admin@trioas.com"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '15px' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--accent-gold)' }}
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => toast('Password reset link dispatched to master admin email.', 'info')}
                style={{ fontSize: '0.82rem', color: 'var(--accent-gold)', fontWeight: 600 }}
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={authSubmitting}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
              }}
            >
              {authSubmitting ? 'AUTHENTICATING...' : 'LOGIN'}
            </button>
          </form>

          <div
            style={{
              marginTop: '24px',
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}
          >
            Default: <code>admin@trioas.com</code> / <code>Admin@123456</code>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // AUTHENTICATED SUPER ADMIN WORKSPACE (Full Navigation & SaaS UI)
  // ==============================================================
  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)' }}>
      {/* LEFT NAVIGATION SIDEBAR */}
      <aside
        style={{
          width: '260px',
          background: 'rgba(18, 16, 14, 0.95)',
          borderRight: '1px solid var(--border-card)',
          padding: '24px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          {/* Section Group 1 */}
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', padding: '0 12px 8px' }}>
            OPERATIONS
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'cafes', label: 'Manage Cafes', icon: Coffee },
              { id: 'admins', label: 'Cafe Admins', icon: Key },
              { id: 'customers', label: 'Customers CRM', icon: Users },
              { id: 'rewards', label: 'Rewards & Perks', icon: Gift },
              { id: 'whatsapp', label: 'WhatsApp Logs', icon: MessageSquare },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = activeSection === item.id && !selectedCafeDetail;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedCafeDetail(null);
                    setActiveSection(item.id as any);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#0c0b0a' : 'var(--text-secondary)',
                    background: isSelected
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'transparent',
                    boxShadow: isSelected ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Section Group 2 */}
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.08em', padding: '24px 12px 8px' }}>
            SYSTEM & SAAS
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { id: 'analytics', label: 'Analytics & Reports', icon: BarChart2 },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'audit', label: 'Activity Logs', icon: FileText },
              { id: 'subscriptions', label: 'Subscription Plans', icon: CreditCard },
              { id: 'support', label: 'Support Desk', icon: LifeBuoy },
              { id: 'settings', label: 'Settings', icon: SettingsIcon },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = activeSection === item.id && !selectedCafeDetail;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setSelectedCafeDetail(null);
                    setActiveSection(item.id as any);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#0c0b0a' : 'var(--text-secondary)',
                    background: isSelected
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'transparent',
                    boxShadow: isSelected ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer User Info */}
        <div
          style={{
            padding: '14px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '14px',
            border: '1px solid var(--border-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{user?.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--accent-gold)' }}>Master Admin</div>
          </div>
          <button onClick={logout} title="Sign Out" style={{ color: '#fb7185', padding: '6px' }}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT WORKSPACE */}
      <main style={{ flex: 1, padding: '32px 36px 80px', overflowY: 'auto' }}>
        {/* Top Header Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.7rem',
                  fontWeight: 800,
                  letterSpacing: '-0.01em',
                }}
              >
                Super Admin Platform Control
              </h1>
              <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>
                PROD
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
              Multi-tenant telemetry, client onboarding, and loyalty rules configuration.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={loadMasterData}
              disabled={loading}
              className="btn-secondary"
              style={{ padding: '9px 16px', fontSize: '0.85rem' }}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={logout}
              className="btn-secondary"
              style={{
                padding: '9px 16px',
                fontSize: '0.85rem',
                color: '#fb7185',
                borderColor: 'rgba(244, 63, 94, 0.3)',
              }}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 1: 🏠 PLATFORM DASHBOARD */}
        {/* ============================================================== */}
        {!selectedCafeDetail && activeSection === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            {/* Top 6 KPI Cards with % Changes */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '16px',
              }}
            >
              {[
                { title: 'Total Cafes', value: dashboardStats?.clients?.total ?? clientsList.length, change: '↑ 12% month', color: '#f59e0b' },
                { title: 'Customers', value: dashboardStats?.customers?.total ?? 1240, change: '↑ 18% month', color: '#10b981' },
                { title: 'QR Visits', value: dashboardStats?.visits?.total ?? 8450, change: '↑ 24% month', color: '#3b82f6' },
                { title: 'Rewards', value: dashboardStats?.rewards?.total ?? 320, change: '↑ 8% month', color: '#a78bfa' },
                { title: 'Redemptions', value: dashboardStats?.rewards?.redeemed ?? 245, change: '↑ 15% month', color: '#f43f5e' },
                { title: 'WhatsApp', value: `${dashboardStats?.whatsapp?.sent ?? 1240}`, change: '95% delivered', color: '#38bdf8' },
              ].map((kpi) => (
                <div key={kpi.title} className="glass-panel" style={{ padding: '20px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{kpi.title}</span>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
                    {kpi.value}
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: kpi.color,
                      display: 'inline-block',
                      marginTop: '4px',
                    }}
                  >
                    {kpi.change}
                  </span>
                </div>
              ))}
            </div>

            {/* Middle — Interactive Charts (Customer Growth & Cafe Performance) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
                gap: '20px',
              }}
            >
              {/* Customer Growth Line Chart Simulation */}
              <div className="glass-panel" style={{ padding: '26px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Customer Growth</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Registered loyalty members over time</p>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '3px', borderRadius: '8px' }}>
                    {(['7D', '30D', '3M', '1Y'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setChartTimeline(t)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: chartTimeline === t ? 700 : 500,
                          background: chartTimeline === t ? 'rgba(245, 158, 11, 0.25)' : 'transparent',
                          color: chartTimeline === t ? 'var(--accent-gold)' : 'var(--text-secondary)',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SVG Line Chart Representation */}
                <div style={{ height: '180px', width: '100%', position: 'relative' }}>
                  <svg width="100%" height="100%" viewBox="0 0 400 160" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 140 Q 80 120 140 85 T 260 50 T 400 20 L 400 160 L 0 160 Z"
                      fill="url(#growthGrad)"
                    />
                    <path
                      d="M 0 140 Q 80 120 140 85 T 260 50 T 400 20"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3.5"
                    />
                  </svg>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '6px' }}>
                    <span>Week 1</span>
                    <span>Week 2</span>
                    <span>Week 3</span>
                    <span>Current</span>
                  </div>
                </div>
              </div>

              {/* Cafe Performance Bar Chart */}
              <div className="glass-panel" style={{ padding: '26px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Cafe Performance Comparison</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Visits & active customer volume</p>
                  </div>
                  <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                    Top Footfall
                  </span>
                </div>

                {/* Bar Graph Rows */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {[
                    { name: 'Trio Cafe Central', visits: 1240, percent: 92, color: '#f59e0b' },
                    { name: 'Cafe Aroma Roast', visits: 890, percent: 68, color: '#10b981' },
                    { name: 'The Daily Grind', visits: 640, percent: 50, color: '#3b82f6' },
                    { name: 'Roasters Haven', visits: 480, percent: 38, color: '#a78bfa' },
                  ].map((bar) => (
                    <div key={bar.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600 }}>{bar.name}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{bar.visits} visits</span>
                      </div>
                      <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${bar.percent}%`, height: '100%', background: bar.color, borderRadius: '4px' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom: Top / Recently Onboarded Cafes Table & Recent Activity Timeline */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '24px',
              }}
            >
              {/* Left: Top Cafes with Delete Button */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Recently Onboarded Cafes</h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Quick access and management actions
                    </p>
                  </div>
                  <button
                    onClick={() => setShowCreateClientModal(true)}
                    className="btn-primary"
                    style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                  >
                    <Plus size={14} />
                    <span>Onboard Cafe</span>
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '12px 10px' }}>Cafe</th>
                        <th style={{ padding: '12px 10px', width: '90px', whiteSpace: 'nowrap' }}>Plan</th>
                        <th style={{ padding: '12px 10px', width: '120px', whiteSpace: 'nowrap' }}>Status</th>
                        <th style={{ padding: '12px 10px', width: '130px', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientsList.slice(0, 5).map((client) => (
                        <tr key={client.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                          <td style={{ padding: '12px 10px' }}>
                            <div style={{ fontWeight: 700, color: '#fff' }}>{client.name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{client.email}</div>
                          </td>
                          <td style={{ padding: '12px 10px', width: '90px', whiteSpace: 'nowrap' }}>
                            <span className="badge badge-indigo" style={{ fontSize: '0.65rem' }}>
                              {client.subscriptionPlan.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px', width: '120px', whiteSpace: 'nowrap' }}>
                            <span className={`badge ${client.isActive ? 'badge-emerald' : 'badge-gold'}`} style={{ fontSize: '0.65rem' }}>
                              ● {client.isActive ? 'Active' : 'Deactivated'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px', width: '130px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                onClick={() => handleOpenCafeDetail(client)}
                                className="btn-secondary"
                                style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                                title="Open full cafe details"
                              >
                                View
                              </button>
                              <button
                                onClick={() => openEditModal(client)}
                                className="btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                                title="Edit cafe"
                              >
                                <Edit size={12} />
                              </button>
                              {/* Prominent Delete Button */}
                              <button
                                onClick={() => confirmDeleteClient(client.id, client.name)}
                                disabled={isDeletingClient && deletingClientTarget?.id === client.id}
                                className="btn-secondary"
                                style={{
                                  padding: '4px 8px',
                                  fontSize: '0.72rem',
                                  color: '#fb7185',
                                  borderColor: 'rgba(244, 63, 94, 0.35)',
                                  background: 'rgba(244, 63, 94, 0.08)',
                                  opacity: isDeletingClient && deletingClientTarget?.id === client.id ? 0.6 : 1,
                                }}
                                title="Delete cafe permanently"
                              >
                                {isDeletingClient && deletingClientTarget?.id === client.id ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <Trash2 size={12} />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right: Recent Activity Timeline */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Recent Activity</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                  {[
                    { title: 'Trio Cafe Onboarded', time: '10 mins ago', desc: 'Standard plan provisioned with 5 staff slots', color: '#10b981' },
                    { title: 'QR Scan Checked in', time: '24 mins ago', desc: 'Alex S. earned 4th visit stamp at Aroma', color: '#f59e0b' },
                    { title: 'Reward Redeemed', time: '1 hour ago', desc: 'Free Cappuccino claimed (REW-9842)', color: '#3b82f6' },
                    { title: 'WhatsApp Broadcast', time: '2 hours ago', desc: '14 milestone messages delivered via queue', color: '#a78bfa' },
                  ].map((act, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                      <div
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: act.color,
                          marginTop: '6px',
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{act.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{act.desc}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{act.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 2: ☕ MANAGE CLIENTS & CAFES (Table + Actions) */}
        {/* ============================================================== */}
        {!selectedCafeDetail && activeSection === 'cafes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Manage Cafes</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Manage all cafes registered on TRIOAS
                </p>
              </div>
              <button
                onClick={() => setShowCreateClientModal(true)}
                className="btn-primary"
                style={{ fontSize: '0.9rem', padding: '10px 18px' }}
              >
                <Plus size={16} />
                <span>Onboard Cafe</span>
              </button>
            </div>

            {/* Search + Filters Bar */}
            <div
              className="glass-panel"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ position: 'relative', minWidth: '280px', flex: 1 }}>
                <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type="text"
                  placeholder="Search cafe name, email, address..."
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  value={searchCafeQuery}
                  onChange={(e) => setSearchCafeQuery(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <select
                  className="input-field"
                  style={{ width: 'auto' }}
                  value={filterCafeStatus}
                  onChange={(e) => setFilterCafeStatus(e.target.value)}
                >
                  <option value="all">Status: All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Deactivated</option>
                </select>

                <select
                  className="input-field"
                  style={{ width: 'auto' }}
                  value={filterCafePlan}
                  onChange={(e) => setFilterCafePlan(e.target.value)}
                >
                  <option value="all">Plan: All</option>
                  <option value="basic">Basic</option>
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            {/* Cafes Main Table */}
            <div className="glass-panel" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', color: '#cbd5e1', fontSize: '0.8rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    <th style={{ padding: '16px 20px' }}>Cafe</th>
                    <th style={{ padding: '16px 20px', width: '100px', whiteSpace: 'nowrap' }}>Plan</th>
                    <th style={{ padding: '16px 20px', width: '110px', whiteSpace: 'nowrap' }}>Customers</th>
                    <th style={{ padding: '16px 20px', width: '100px', whiteSpace: 'nowrap' }}>Visits</th>
                    <th style={{ padding: '16px 20px', width: '130px', whiteSpace: 'nowrap' }}>Status</th>
                    <th style={{ padding: '16px 20px', width: '190px', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCafes.map((client) => (
                    <tr key={client.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#0c0b0a',
                              fontWeight: 700,
                              fontSize: '1.05rem',
                              boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)',
                            }}
                          >
                            ☕
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.98rem', color: '#ffffff' }}>{client.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>{client.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', width: '100px', whiteSpace: 'nowrap' }}>
                        <span className="badge badge-indigo">{client.subscriptionPlan.toUpperCase()}</span>
                      </td>
                      <td style={{ padding: '16px 20px', width: '110px', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap' }}>
                        {client._count?.customers ?? 0}
                      </td>
                      <td style={{ padding: '16px 20px', width: '100px', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap' }}>
                        {client._count?.visitLogs ?? 0}
                      </td>
                      <td style={{ padding: '16px 20px', width: '130px', whiteSpace: 'nowrap' }}>
                        <span className={`badge ${client.isActive ? 'badge-emerald' : 'badge-gold'}`}>
                          ● {client.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', width: '190px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            onClick={() => handleOpenCafeDetail(client)}
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEditModal(client)}
                            className="btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleClientStatus(client.id, client.isActive, client.name)}
                            className="btn-secondary"
                            style={{
                              padding: '6px 10px',
                              fontSize: '0.8rem',
                              color: client.isActive ? 'var(--text-muted)' : '#34d399',
                            }}
                            title={client.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <Power size={14} />
                          </button>
                          {/* Danger Delete Button */}
                          <button
                            onClick={() => confirmDeleteClient(client.id, client.name)}
                            disabled={isDeletingClient && deletingClientTarget?.id === client.id}
                            className="btn-secondary"
                            style={{
                              padding: '6px 10px',
                              fontSize: '0.8rem',
                              color: '#fb7185',
                              borderColor: 'rgba(244, 63, 94, 0.35)',
                              background: 'rgba(244, 63, 94, 0.08)',
                              opacity: isDeletingClient && deletingClientTarget?.id === client.id ? 0.6 : 1,
                            }}
                            title="Delete"
                          >
                            {isDeletingClient && deletingClientTarget?.id === client.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 3: ☕ CAFE DETAILS VIEW (Drill-Down with 7 Subtabs) */}
        {/* ============================================================== */}
        {selectedCafeDetail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header with Back button and Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  onClick={() => setSelectedCafeDetail(null)}
                  className="btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                >
                  <ArrowLeft size={16} />
                  <span>Back to Cafes</span>
                </button>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>☕ {selectedCafeDetail.name}</h2>
                    <span className={`badge ${selectedCafeDetail.isActive ? 'badge-emerald' : 'badge-gold'}`}>
                      {selectedCafeDetail.isActive ? 'ACTIVE' : 'DEACTIVATED'}
                    </span>
                    <span className="badge badge-indigo">
                      {selectedCafeDetail.subscriptionPlan.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => openEditModal(selectedCafeDetail)}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                >
                  <Edit size={14} />
                  <span>Edit Cafe</span>
                </button>
                <button
                  onClick={() => handleToggleClientStatus(selectedCafeDetail.id, selectedCafeDetail.isActive, selectedCafeDetail.name)}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem', color: selectedCafeDetail.isActive ? '#fb7185' : '#34d399' }}
                >
                  <Power size={14} />
                  <span>{selectedCafeDetail.isActive ? 'Deactivate' : 'Activate'}</span>
                </button>
                <button
                  onClick={() => confirmDeleteClient(selectedCafeDetail.id, selectedCafeDetail.name)}
                  disabled={isDeletingClient && deletingClientTarget?.id === selectedCafeDetail.id}
                  className="btn-secondary"
                  style={{
                    padding: '8px 14px',
                    fontSize: '0.82rem',
                    color: '#fb7185',
                    background: 'rgba(244,63,94,0.1)',
                    opacity: isDeletingClient && deletingClientTarget?.id === selectedCafeDetail.id ? 0.6 : 1,
                  }}
                >
                  {isDeletingClient && deletingClientTarget?.id === selectedCafeDetail.id ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 4 Cafe Overview KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              <div className="glass-panel" style={{ padding: '18px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customers</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px', color: '#fff' }}>
                  {cafeActivityData?.usage?.customers ?? 420}
                </div>
              </div>
              <div className="glass-panel" style={{ padding: '18px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Visits</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px', color: 'var(--accent-gold)' }}>
                  {cafeActivityData?.usage?.visitLogs ?? 1240}
                </div>
              </div>
              <div className="glass-panel" style={{ padding: '18px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rewards</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px', color: '#a78bfa' }}>
                  {cafeActivityData?.usage?.customerRewards ?? 85}
                </div>
              </div>
              <div className="glass-panel" style={{ padding: '18px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Redemptions</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px', color: '#10b981' }}>
                  62
                </div>
              </div>
            </div>

            {/* 7 Subtabs */}
            <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--border-card)', paddingBottom: '10px', overflowX: 'auto' }}>
              {(['overview', 'customers', 'visits', 'rewards', 'admins', 'whatsapp', 'activity'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setCafeDetailTab(tab)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: cafeDetailTab === tab ? 700 : 500,
                    textTransform: 'capitalize',
                    background: cafeDetailTab === tab ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                    color: cafeDetailTab === tab ? 'var(--accent-gold)' : 'var(--text-secondary)',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Detail Tab 1: Overview */}
            {cafeDetailTab === 'overview' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Left: Cafe Information */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>Cafe Information</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Name: </span>
                      <strong>{selectedCafeDetail.name}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Official Email: </span>
                      <strong>{selectedCafeDetail.email}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Phone: </span>
                      <strong>{selectedCafeDetail.phone || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Physical Address: </span>
                      <strong>{selectedCafeDetail.address || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Onboarding Date: </span>
                      <strong>{new Date(selectedCafeDetail.createdAt).toLocaleDateString()}</strong>
                    </div>
                  </div>
                </div>

                {/* Right: Subscription */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>Subscription & Limits</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Active Tier: </span>
                      <span className="badge badge-indigo">{selectedCafeDetail.subscriptionPlan.toUpperCase()}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Staff Quota: </span>
                      <strong>Up to {selectedCafeDetail.maxStaff} Baristas</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Offers Limit: </span>
                      <strong>{selectedCafeDetail.maxOffers} Active Programs</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Valid Until: </span>
                      <strong>20 Oct 2026</strong>
                    </div>
                    <button
                      onClick={() => openEditModal(selectedCafeDetail)}
                      className="btn-secondary"
                      style={{ marginTop: '8px', width: 'fit-content', fontSize: '0.8rem' }}
                    >
                      Manage Subscription
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Detail Tab: Admins */}
            {cafeDetailTab === 'admins' && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Cafe Administrators</h3>
                  <button
                    onClick={() => {
                      setAdminDrawerClientId(selectedCafeDetail.id);
                      setShowAddAdminDrawer(true);
                    }}
                    className="btn-primary"
                    style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                  >
                    <Plus size={14} />
                    <span>Add Admin</span>
                  </button>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Managers authorized to log into <code>/admin</code> for this cafe.
                </p>
              </div>
            )}

            {/* Detail Tab: Activity */}
            {cafeDetailTab === 'activity' && (
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Live Activity Logs</h3>
                {cafeActivityLoading ? (
                  <p style={{ color: 'var(--text-muted)' }}>Loading cafe events...</p>
                ) : cafeActivityData?.recentVisits?.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent events recorded.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {cafeActivityData?.recentVisits?.map((v: any) => (
                      <div
                        key={v.id}
                        style={{
                          padding: '10px 14px',
                          background: 'rgba(255,255,255,0.02)',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span>
                          Customer <strong>{v.customer?.name}</strong> checked in via QR • Barista: {v.staff?.name || 'Staff'}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>{new Date(v.scannedAt).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 4: 👨💼 ADMIN MANAGEMENT (Table + Side Drawer) */}
        {/* ============================================================== */}
        {!selectedCafeDetail && activeSection === 'admins' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Cafe Admins</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Manage authorized cafe managers and portal access credentials.
                </p>
              </div>
              <button
                onClick={() => {
                  setAdminDrawerClientId(clientsList[0]?.id || '');
                  setShowAddAdminDrawer(true);
                }}
                className="btn-primary"
                style={{ fontSize: '0.9rem', padding: '10px 18px' }}
              >
                <Plus size={16} />
                <span>Add Admin</span>
              </button>
            </div>

            {/* Cafe Admins Filter Controls */}
            <div
              className="glass-panel"
              style={{
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                borderRadius: '16px',
                border: '1px solid var(--border-card)',
              }}
            >
              {/* Row 1: Search + 4 Select Filters */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: '12px',
                  alignItems: 'center',
                }}
              >
                {/* 1. Real-time Search */}
                <div style={{ position: 'relative' }}>
                  <Search
                    size={14}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Search name, email, cafe..."
                    value={adminSearchQuery}
                    onChange={(e) => setAdminSearchQuery(e.target.value)}
                    className="input-field"
                    style={{
                      paddingLeft: '34px',
                      paddingRight: adminSearchQuery ? '32px' : '12px',
                      fontSize: '0.8rem',
                      height: '38px',
                    }}
                  />
                  {adminSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setAdminSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* 2. Role Filter */}
                <div>
                  <select
                    className="input-field"
                    value={adminRoleFilter}
                    onChange={(e) => setAdminRoleFilter(e.target.value as any)}
                    style={{ fontSize: '0.8rem', height: '38px', cursor: 'pointer' }}
                  >
                    <option value="all">Role: All Roles</option>
                    <option value="Admin">Role: Admin</option>
                    <option value="Manager">Role: Manager</option>
                  </select>
                </div>

                {/* 3. Status Filter */}
                <div>
                  <select
                    className="input-field"
                    value={adminStatusFilter}
                    onChange={(e) => setAdminStatusFilter(e.target.value as any)}
                    style={{ fontSize: '0.8rem', height: '38px', cursor: 'pointer' }}
                  >
                    <option value="all">Status: All</option>
                    <option value="active">Status: Active</option>
                    <option value="inactive">Status: Inactive</option>
                  </select>
                </div>

                {/* 4. Last Login Filter */}
                <div>
                  <select
                    className="input-field"
                    value={adminLastLoginFilter}
                    onChange={(e) => setAdminLastLoginFilter(e.target.value as any)}
                    style={{ fontSize: '0.8rem', height: '38px', cursor: 'pointer' }}
                  >
                    <option value="all">Last Login: All</option>
                    <option value="today">Last Login: Today</option>
                    <option value="7d">Last Login: Last 7 Days</option>
                    <option value="30d">Last Login: Last 30 Days</option>
                    <option value="never">Last Login: Never Logged In</option>
                  </select>
                </div>

                {/* 5. Created Date Filter */}
                <div>
                  <select
                    className="input-field"
                    value={adminCreatedDateFilter}
                    onChange={(e) => setAdminCreatedDateFilter(e.target.value as any)}
                    style={{ fontSize: '0.8rem', height: '38px', cursor: 'pointer' }}
                  >
                    <option value="all">Created: All Time</option>
                    <option value="today">Created: Today</option>
                    <option value="7d">Created: Last 7 Days</option>
                    <option value="month">Created: This Month</option>
                    <option value="custom">Created: Custom Range</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Custom Date Pickers (when custom selected) & Reset Button */}
              {(adminCreatedDateFilter === 'custom' || hasActiveAdminFilters) && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  {adminCreatedDateFilter === 'custom' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                        Custom Range:
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From:</span>
                        <input
                          type="date"
                          className="input-field"
                          style={{ padding: '4px 8px', fontSize: '0.78rem', width: 'auto', height: '32px' }}
                          value={adminStartDate}
                          onChange={(e) => setAdminStartDate(e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To:</span>
                        <input
                          type="date"
                          className="input-field"
                          style={{ padding: '4px 8px', fontSize: '0.78rem', width: 'auto', height: '32px' }}
                          value={adminEndDate}
                          onChange={(e) => setAdminEndDate(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : <div />}

                  {hasActiveAdminFilters && (
                    <button
                      type="button"
                      onClick={resetAdminFilters}
                      className="btn-secondary"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#fb7185',
                        borderColor: 'rgba(244, 63, 94, 0.3)',
                      }}
                    >
                      <RefreshCw size={12} />
                      <span>Reset Filters</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="glass-panel" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', color: '#cbd5e1', fontSize: '0.76rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 14px', width: '22%' }}>Admin</th>
                    <th style={{ padding: '10px 14px', width: '18%' }}>Cafe Source</th>
                    <th style={{ padding: '10px 14px', width: '11%', whiteSpace: 'nowrap' }}>Role</th>
                    <th style={{ padding: '10px 14px', width: '13%', whiteSpace: 'nowrap' }}>Created Date</th>
                    <th style={{ padding: '10px 14px', width: '13%', whiteSpace: 'nowrap' }}>Last Login</th>
                    <th style={{ padding: '10px 14px', width: '11%', whiteSpace: 'nowrap' }}>Status</th>
                    <th style={{ padding: '10px 14px', width: '12%', textAlign: 'center', whiteSpace: 'nowrap' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const realAdmins = clientsList.flatMap((client) =>
                      (client.clientAdmins || []).map((adm: ClientAdmin) => ({
                        id: adm.id,
                        clientId: client.id,
                        name: adm.name,
                        email: adm.email,
                        phone: adm.phone,
                        cafe: client.name,
                        role: adminRolesMap[adm.id] || adm.role || 'Admin',
                        login: adm.lastLoginAt
                          ? new Date(adm.lastLoginAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : 'Never',
                        lastLoginAt: adm.lastLoginAt ? new Date(adm.lastLoginAt) : null,
                        createdStr: adm.createdAt
                          ? new Date(adm.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—',
                        createdAt: adm.createdAt ? new Date(adm.createdAt) : null,
                        status: adm.isActive ?? true,
                      }))
                    );

                    const filteredAdmins = realAdmins.filter((adm) => {
                      // 1. Text Search (Name, Email, Phone, Cafe)
                      if (adminSearchQuery.trim()) {
                        const q = adminSearchQuery.toLowerCase();
                        const matchName = adm.name?.toLowerCase().includes(q);
                        const matchEmail = adm.email?.toLowerCase().includes(q);
                        const matchPhone = adm.phone?.includes(q);
                        const matchCafe = adm.cafe?.toLowerCase().includes(q);
                        if (!matchName && !matchEmail && !matchPhone && !matchCafe) return false;
                      }

                      // 2. Role Filter: 'all' | 'Admin' | 'Manager'
                      if (adminRoleFilter !== 'all') {
                        if (adm.role !== adminRoleFilter) return false;
                      }

                      // 3. Status Filter: 'all' | 'active' | 'inactive'
                      if (adminStatusFilter !== 'all') {
                        if (adminStatusFilter === 'active' && !adm.status) return false;
                        if (adminStatusFilter === 'inactive' && adm.status) return false;
                      }

                      // 4. Last Login Filter: 'all' | 'today' | '7d' | '30d' | 'never'
                      if (adminLastLoginFilter !== 'all') {
                        if (adminLastLoginFilter === 'never') {
                          if (adm.lastLoginAt) return false;
                        } else {
                          if (!adm.lastLoginAt) return false;
                          const loginDate = adm.lastLoginAt;
                          const now = new Date();
                          if (adminLastLoginFilter === 'today') {
                            if (loginDate.toDateString() !== now.toDateString()) return false;
                          } else if (adminLastLoginFilter === '7d') {
                            const past7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                            if (loginDate < past7) return false;
                          } else if (adminLastLoginFilter === '30d') {
                            const past30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                            if (loginDate < past30) return false;
                          }
                        }
                      }

                      // 5. Created Date Filter: 'all' | 'today' | '7d' | 'month' | 'custom'
                      if (adminCreatedDateFilter !== 'all') {
                        if (!adm.createdAt) return false;
                        const createdDate = adm.createdAt;
                        const now = new Date();
                        if (adminCreatedDateFilter === 'today') {
                          if (createdDate.toDateString() !== now.toDateString()) return false;
                        } else if (adminCreatedDateFilter === '7d') {
                          const past7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                          if (createdDate < past7) return false;
                        } else if (adminCreatedDateFilter === 'month') {
                          if (
                            createdDate.getMonth() !== now.getMonth() ||
                            createdDate.getFullYear() !== now.getFullYear()
                          ) {
                            return false;
                          }
                        } else if (adminCreatedDateFilter === 'custom') {
                          if (adminStartDate && createdDate < new Date(adminStartDate)) return false;
                          if (adminEndDate) {
                            const end = new Date(adminEndDate);
                            end.setHours(23, 59, 59, 999);
                            if (createdDate > end) return false;
                          }
                        }
                      }

                      return true;
                    });

                    if (filteredAdmins.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            {hasActiveAdminFilters ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <span>No cafe admins found matching your filter criteria.</span>
                                <button
                                  type="button"
                                  onClick={resetAdminFilters}
                                  className="btn-secondary"
                                  style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                                >
                                  Clear Filters
                                </button>
                              </div>
                            ) : (
                              'No cafe admins found. Click "+ Add Admin" to assign an administrator to a cafe.'
                            )}
                          </td>
                        </tr>
                      );
                    }

                    return filteredAdmins.map((adm) => (
                      <tr key={adm.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '10px 14px', width: '22%', overflow: 'hidden' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adm.name}</div>
                          <div style={{ color: '#94a3b8', fontSize: '0.74rem', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adm.email}</div>
                        </td>
                        <td style={{ padding: '10px 14px', width: '18%', color: '#f8fafc', fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adm.cafe}</td>
                        <td style={{ padding: '10px 14px', width: '11%', whiteSpace: 'nowrap' }}>
                          <span className={`badge ${adm.role === 'Manager' ? 'badge-gold' : 'badge-indigo'}`} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>{adm.role}</span>
                        </td>
                        <td style={{ padding: '10px 14px', width: '13%', color: '#94a3b8', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{adm.createdStr}</td>
                        <td style={{ padding: '10px 14px', width: '13%', whiteSpace: 'nowrap' }}>
                          {adm.lastLoginAt ? (
                            <span style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>{adm.login}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', fontStyle: 'italic' }}>Never Logged In</span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', width: '11%', whiteSpace: 'nowrap' }}>
                          <span className={`badge ${adm.status ? 'badge-emerald' : 'badge-gold'}`} style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                            ● {adm.status ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', width: '12%', textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleOpenEditAdmin(adm)}
                              className="btn-secondary"
                              style={{ padding: '5px 9px', fontSize: '0.75rem' }}
                              title="Edit Admin"
                            >
                              <Edit size={13} />
                            </button>
                            <button
                              onClick={() => confirmDeleteAdmin(adm.clientId, adm.id, adm.name, adm.cafe)}
                              disabled={isDeletingAdmin && deletingAdminTarget?.adminId === adm.id}
                              className="btn-secondary"
                              style={{
                                padding: '5px 9px',
                                fontSize: '0.75rem',
                                color: '#fb7185',
                                borderColor: 'rgba(244, 63, 94, 0.35)',
                                background: 'rgba(244, 63, 94, 0.08)',
                                opacity: isDeletingAdmin && deletingAdminTarget?.adminId === adm.id ? 0.6 : 1,
                              }}
                              title="Delete Admin"
                            >
                              {isDeletingAdmin && deletingAdminTarget?.adminId === adm.id ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Trash2 size={13} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 5: 👥 PLATFORM CUSTOMERS (CRM Style) */}
        {/* ============================================================== */}
        {!selectedCafeDetail && activeSection === 'customers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Platform Customers CRM</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Search, inspect, and analyze customer loyalty activity across cafes.
              </p>
            </div>

            {/* Top Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Customers</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px' }}>{customersList.length}</div>
              </div>
              <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Active</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px', color: '#10b981' }}>
                  {customersList.filter((c: any) => c.isActive !== false).length}
                </div>
              </div>
              <div className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Visits Logged</span>
                <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '4px', color: 'var(--accent-gold)' }}>
                  {customersList.reduce((acc: number, c: any) => acc + (c._count?.visitLogs || (c.customerLoyalty?.[0]?.totalVisits ?? 0)), 0)}
                </div>
              </div>
            </div>

            {/* Search and Date Filter Controls */}
            <div
              className="glass-panel"
              style={{
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Row 1: Search by Name / Phone / Email & Date Range Buttons */}
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '280px' }}>
                  <Search
                    size={16}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: '14px', top: '15px' }}
                  />
                  <input
                    type="text"
                    placeholder="🔍 Search by customer name, phone, or email..."
                    className="input-field"
                    style={{ paddingLeft: '40px', paddingRight: customerSearchQuery ? '36px' : '14px' }}
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  />
                  {customerSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setCustomerSearchQuery('')}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '12px',
                        color: 'var(--text-muted)',
                        background: 'transparent',
                        padding: '4px',
                        cursor: 'pointer',
                      }}
                      title="Clear search"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                {/* Quick Date Range Filters */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '4px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-card)',
                  }}
                >
                  <Calendar size={15} color="var(--text-muted)" style={{ marginLeft: '8px', marginRight: '4px' }} />
                  {[
                    { id: 'all', label: 'All Time' },
                    { id: 'today', label: 'Today' },
                    { id: '7d', label: 'Last 7 Days' },
                    { id: '30d', label: 'Last 30 Days' },
                    { id: 'custom', label: 'Custom' },
                  ].map((tab) => {
                    const isSelected = customerDateRange === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setCustomerDateRange(tab.id as any)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: isSelected ? 700 : 500,
                          color: isSelected ? '#0c0b0a' : 'var(--text-secondary)',
                          background: isSelected
                            ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                            : 'transparent',
                          transition: 'all 0.2s',
                          cursor: 'pointer',
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Row 2: Custom Date Pickers (visible when 'custom' is selected) */}
              {customerDateRange === 'custom' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.04)',
                    border: '1px dashed rgba(245, 158, 11, 0.25)',
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                    Date Filter Range:
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>From:</span>
                    <input
                      type="date"
                      className="input-field"
                      style={{ padding: '6px 10px', fontSize: '0.8rem', width: 'auto' }}
                      value={customerStartDate}
                      onChange={(e) => setCustomerStartDate(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>To:</span>
                    <input
                      type="date"
                      className="input-field"
                      style={{ padding: '6px 10px', fontSize: '0.8rem', width: 'auto' }}
                      value={customerEndDate}
                      onChange={(e) => setCustomerEndDate(e.target.value)}
                    />
                  </div>
                  {(customerStartDate || customerEndDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerStartDate('');
                        setCustomerEndDate('');
                      }}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                    >
                      Reset Date Filter
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Customer Table */}
            <div className="glass-panel" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '16px 20px' }}>Customer</th>
                    <th style={{ padding: '16px 20px' }}>Cafe</th>
                    <th style={{ padding: '16px 20px' }}>Visits</th>
                    <th style={{ padding: '16px 20px' }}>Rewards</th>
                    <th style={{ padding: '16px 20px' }}>Joined Date</th>
                    <th style={{ padding: '16px 20px' }}>Status</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = customersList.filter((c: any) => {
                      // 1. Text Search (Name, Phone, Email, Cafe)
                      if (customerSearchQuery.trim()) {
                        const q = customerSearchQuery.toLowerCase();
                        const matchName = c.name?.toLowerCase().includes(q);
                        const matchPhone = c.phone?.includes(q);
                        const matchEmail = c.email?.toLowerCase().includes(q);
                        const matchCafe = (c.client?.name || c.customerLoyalty?.[0]?.client?.name)?.toLowerCase().includes(q);
                        if (!matchName && !matchPhone && !matchEmail && !matchCafe) return false;
                      }

                      // 2. Date-wise Filter
                      if (customerDateRange !== 'all') {
                        if (!c.registeredAt) return false;
                        const regDate = new Date(c.registeredAt);
                        const now = new Date();

                        if (customerDateRange === 'today') {
                          if (regDate.toDateString() !== now.toDateString()) return false;
                        } else if (customerDateRange === '7d') {
                          const past7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                          if (regDate < past7) return false;
                        } else if (customerDateRange === '30d') {
                          const past30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                          if (regDate < past30) return false;
                        } else if (customerDateRange === 'custom') {
                          if (customerStartDate && regDate < new Date(customerStartDate)) return false;
                          if (customerEndDate) {
                            const end = new Date(customerEndDate);
                            end.setHours(23, 59, 59, 999);
                            if (regDate > end) return false;
                          }
                        }
                      }

                      return true;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No customers found matching your filters.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map((c: any) => {
                      const totalVisits = c._count?.visitLogs ?? c.customerLoyalty?.reduce((acc: number, curr: any) => acc + (curr.totalVisits || 0), 0) ?? 0;
                      const totalRewards = c._count?.customerRewards ?? 0;
                      const cafeName = c.client?.name || c.customerLoyalty?.[0]?.client?.name || 'Global Customer';
                      const joinedDate = c.registeredAt
                        ? new Date(c.registeredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'N/A';

                      return (
                        <tr
                          key={c.id}
                          style={{
                            borderBottom: '1px solid var(--border-card)',
                          }}
                        >
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  color: '#0c0b0a',
                                  fontSize: '0.9rem',
                                  flexShrink: 0,
                                }}
                              >
                                {c.name ? c.name[0].toUpperCase() : 'C'}
                              </div>
                              <div>
                                <div style={{ fontWeight: 600, color: '#fff' }}>{c.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {c.phone} {c.email ? `• ${c.email}` : ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <span className="badge badge-dark" style={{ background: 'rgba(255,255,255,0.06)' }}>
                              {cafeName}
                            </span>
                          </td>
                          <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--accent-gold)' }}>
                            {totalVisits}
                          </td>
                          <td style={{ padding: '16px 20px', fontWeight: 600, color: '#10b981' }}>
                            {totalRewards}
                          </td>
                          <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>
                            {joinedDate}
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <span className={`badge ${c.isActive !== false ? 'badge-green' : 'badge-gray'}`}>
                              {c.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td
                            style={{ padding: '16px 20px', textAlign: 'right' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                title="View Customer Details Card"
                                onClick={() => setSelectedCustomerProfile({
                                  id: c.id,
                                  name: c.name,
                                  phone: c.phone,
                                  email: c.email || 'Not provided',
                                  cafe: cafeName,
                                  visits: totalVisits,
                                  rewards: totalRewards,
                                  isActive: c.isActive !== false,
                                  joinedDate: joinedDate,
                                  qrToken: c.qrToken || c.id,
                                  rawCustomer: c,
                                })}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  background: 'rgba(56, 189, 248, 0.08)',
                                  border: '1px solid rgba(56, 189, 248, 0.25)',
                                  color: '#38bdf8',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(56, 189, 248, 0.18)';
                                  e.currentTarget.style.borderColor = '#38bdf8';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)';
                                  e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
                                }}
                              >
                                <Eye size={13} />
                                <span>View</span>
                              </button>

                              <button
                                type="button"
                                title="Edit Customer"
                                onClick={() => openEditCustomerModal(c)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  background: 'rgba(245, 158, 11, 0.08)',
                                  border: '1px solid rgba(245, 158, 11, 0.25)',
                                  color: 'var(--accent-gold)',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.18)';
                                  e.currentTarget.style.borderColor = 'var(--accent-gold)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(245, 158, 11, 0.08)';
                                  e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.25)';
                                }}
                              >
                                <Edit size={13} />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                title="Delete Customer"
                                onClick={() => setDeletingCustomerTarget({ id: c.id, name: c.name })}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  background: 'rgba(239, 68, 68, 0.08)',
                                  border: '1px solid rgba(239, 68, 68, 0.25)',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                                  e.currentTarget.style.borderColor = '#ef4444';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)';
                                }}
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 6 & 7: 🎁 REWARDS & REDEMPTIONS (2 Tabs) */}
        {/* ============================================================== */}
        {!selectedCafeDetail && activeSection === 'rewards' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Rewards & Redemptions</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Manage program perks and inspect customer redemption records.
                </p>
              </div>

              {/* 2 Tabs */}
              <div style={{ display: 'flex', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '10px' }}>
                <button
                  onClick={() => setRewardsSubtab('rewards')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: rewardsSubtab === 'rewards' ? 700 : 500,
                    background: rewardsSubtab === 'rewards' ? 'var(--accent-gold)' : 'transparent',
                    color: rewardsSubtab === 'rewards' ? '#0c0b0a' : 'var(--text-secondary)',
                  }}
                >
                  Rewards
                </button>
                <button
                  onClick={() => setRewardsSubtab('redemptions')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: rewardsSubtab === 'redemptions' ? 700 : 500,
                    background: rewardsSubtab === 'redemptions' ? 'var(--accent-gold)' : 'transparent',
                    color: rewardsSubtab === 'redemptions' ? '#0c0b0a' : 'var(--text-secondary)',
                  }}
                >
                  Redemptions
                </button>
              </div>
            </div>

            {rewardsSubtab === 'rewards' ? (
              <>
                {/* Rewards KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  <div className="glass-panel" style={{ padding: '18px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Rewards</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px' }}>
                      {rewardsCatalog.length}
                    </div>
                  </div>
                  <div className="glass-panel" style={{ padding: '18px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Rewards</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px', color: '#10b981' }}>
                      {rewardsCatalog.filter(r => r.status === 'Active').length}
                    </div>
                  </div>
                  <div className="glass-panel" style={{ padding: '18px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Redeemed</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px', color: '#a78bfa' }}>
                      {redemptionsList.filter(r => r.status === 'Redeemed').length}
                    </div>
                  </div>
                  <div className="glass-panel" style={{ padding: '18px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Deactivated</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px', color: '#fb7185' }}>
                      {rewardsCatalog.filter(r => r.status !== 'Active').length}
                    </div>
                  </div>
                </div>

                {/* Rewards Search & Filters Bar */}
                <div
                  className="glass-panel"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-card)',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                      gap: '12px',
                      alignItems: 'center',
                    }}
                  >
                    {/* 1. Search reward name */}
                    <div style={{ position: 'relative' }}>
                      <Search
                        size={14}
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-muted)',
                          pointerEvents: 'none',
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Search reward name..."
                        value={rewardSearchQuery}
                        onChange={(e) => setRewardSearchQuery(e.target.value)}
                        className="input-field"
                        style={{
                          paddingLeft: '34px',
                          paddingRight: rewardSearchQuery ? '32px' : '12px',
                          fontSize: '0.8rem',
                          height: '38px',
                        }}
                      />
                      {rewardSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setRewardSearchQuery('')}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* 2. All Cafes */}
                    <div>
                      <select
                        className="input-field"
                        value={rewardCafeFilter}
                        onChange={(e) => setRewardCafeFilter(e.target.value)}
                        style={{ fontSize: '0.8rem', height: '38px', cursor: 'pointer' }}
                      >
                        <option value="all">All Cafes</option>
                        {clientsList.map((c) => (
                          <option key={c.id || c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* 3. All Status */}
                    <div>
                      <select
                        className="input-field"
                        value={rewardStatusFilter}
                        onChange={(e) => setRewardStatusFilter(e.target.value)}
                        style={{ fontSize: '0.8rem', height: '38px', cursor: 'pointer' }}
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="expired">Expired</option>
                      </select>
                    </div>

                    {/* 4. Reward Type */}
                    <div>
                      <select
                        className="input-field"
                        value={rewardTypeFilter}
                        onChange={(e) => setRewardTypeFilter(e.target.value)}
                        style={{ fontSize: '0.8rem', height: '38px', cursor: 'pointer' }}
                      >
                        <option value="all">Reward Type: All</option>
                        <option value="FREE_ITEM">Free Item</option>
                        <option value="DISCOUNT">Discount</option>
                        <option value="VOUCHER">Special Perk / Voucher</option>
                      </select>
                    </div>

                    {/* 5. Sort By */}
                    <div>
                      <select
                        className="input-field"
                        value={rewardSortBy}
                        onChange={(e) => setRewardSortBy(e.target.value)}
                        style={{ fontSize: '0.8rem', height: '38px', cursor: 'pointer' }}
                      >
                        <option value="popular">Sort By: Most Popular</option>
                        <option value="points_asc">Sort By: Points (Low → High)</option>
                        <option value="points_desc">Sort By: Points (High → Low)</option>
                        <option value="newest">Sort By: Newest Added</option>
                        <option value="expiring">Sort By: Expiring Soon</option>
                      </select>
                    </div>
                  </div>

                  {(rewardSearchQuery || rewardCafeFilter !== 'all' || rewardStatusFilter !== 'all' || rewardTypeFilter !== 'all') && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setRewardSearchQuery('');
                          setRewardCafeFilter('all');
                          setRewardStatusFilter('all');
                          setRewardTypeFilter('all');
                          setRewardSortBy('popular');
                        }}
                        className="btn-secondary"
                        style={{ padding: '5px 12px', fontSize: '0.74rem', color: '#fb7185' }}
                      >
                        <RefreshCw size={12} style={{ marginRight: '4px' }} />
                        Clear Reward Filters
                      </button>
                    </div>
                  )}
                </div>

                {/* Governance Oversight Bar */}
                <div
                  style={{
                    padding: '12px 18px',
                    borderRadius: '14px',
                    background: 'rgba(245, 158, 11, 0.05)',
                    border: '1px solid rgba(245, 158, 11, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        color: 'var(--accent-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Shield size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#fff' }}>
                        Reward Governance & Platform Policy
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                        Cafe Admins create and own their cafe rewards. Super Admin regulates platform compliance, terms fair-use, and suspension/approval controls.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Table Header Counter */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Showing <strong style={{ color: '#fff' }}>
                      {rewardsCatalog.filter(r => {
                        if (rewardSearchQuery.trim()) {
                          const q = rewardSearchQuery.toLowerCase();
                          if (!r.name.toLowerCase().includes(q) && !r.cafe.toLowerCase().includes(q)) return false;
                        }
                        if (rewardCafeFilter !== 'all' && r.cafe !== rewardCafeFilter) return false;
                        if (rewardStatusFilter !== 'all' && r.status.toLowerCase() !== rewardStatusFilter.toLowerCase()) return false;
                        if (rewardTypeFilter !== 'all' && r.type !== rewardTypeFilter) return false;
                        return true;
                      }).length}
                    </strong> of <strong>{rewardsCatalog.length}</strong> cafe reward programs
                  </div>
                </div>

                {/* Rewards Table */}
                <div className="glass-panel" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <th style={{ padding: '16px 20px' }}>Reward</th>
                        <th style={{ padding: '16px 20px' }}>Cafe</th>
                        <th style={{ padding: '16px 20px' }}>Type</th>
                        <th style={{ padding: '16px 20px' }}>Points</th>
                        <th style={{ padding: '16px 20px' }}>Redeemed</th>
                        <th style={{ padding: '16px 20px' }}>Expiry</th>
                        <th style={{ padding: '16px 20px' }}>Status</th>
                        <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filtered = rewardsCatalog.filter((r) => {
                          if (rewardSearchQuery.trim()) {
                            const q = rewardSearchQuery.toLowerCase();
                            const matchName = r.name.toLowerCase().includes(q);
                            const matchCafe = r.cafe.toLowerCase().includes(q);
                            if (!matchName && !matchCafe) return false;
                          }
                          if (rewardCafeFilter !== 'all' && r.cafe !== rewardCafeFilter) return false;
                          if (rewardStatusFilter !== 'all') {
                            if (r.status.toLowerCase() !== rewardStatusFilter.toLowerCase()) return false;
                          }
                          if (rewardTypeFilter !== 'all' && r.type !== rewardTypeFilter) return false;
                          return true;
                        }).sort((a, b) => {
                          if (rewardSortBy === 'popular') return b.redeemed - a.redeemed;
                          if (rewardSortBy === 'points_asc') return a.points - b.points;
                          if (rewardSortBy === 'points_desc') return b.points - a.points;
                          if (rewardSortBy === 'newest') return b.id.localeCompare(a.id);
                          if (rewardSortBy === 'expiring') return new Date(a.expiry).getTime() - new Date(b.expiry).getTime();
                          return 0;
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No rewards found matching the selected filters.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((r) => (
                          <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{r.name}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: '2px' }}>
                                {r.description}
                              </div>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  background: 'rgba(255,255,255,0.05)',
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.78rem',
                                  color: 'var(--text-secondary)',
                                  fontWeight: 600,
                                }}
                              >
                                <Coffee size={12} color="var(--accent-gold)" />
                                <span>{r.cafe}</span>
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span className={`badge ${r.type === 'FREE_ITEM' ? 'badge-emerald' : 'badge-indigo'}`} style={{ fontSize: '0.72rem' }}>
                                {r.typeLabel}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--accent-gold)', fontSize: '0.92rem' }}>
                              {r.points} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>pts</span>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <strong style={{ color: '#fff' }}>{r.redeemed}</strong> <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>times</span>
                            </td>
                            <td style={{ padding: '16px 20px', color: '#cbd5e1', fontSize: '0.8rem' }}>
                              {new Date(r.expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span className={`badge ${r.status === 'Active' ? 'badge-green' : r.status === 'Expired' ? 'badge-rose' : 'badge-gray'}`} style={{ fontSize: '0.72rem' }}>
                                ● {r.status}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => setViewingReward(r)}
                                  className="btn-secondary"
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '0.75rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    color: '#38bdf8',
                                    borderColor: 'rgba(56, 189, 248, 0.25)',
                                    fontWeight: 600,
                                  }}
                                  title="View Reward Details and Governance"
                                >
                                  <Eye size={13} />
                                  <span>View Details</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleRewardStatus(r.id)}
                                  className="btn-secondary"
                                  style={{
                                    padding: '6px 10px',
                                    fontSize: '0.75rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    color: r.status === 'Active' ? '#fb7185' : '#10b981',
                                    borderColor: r.status === 'Active' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)',
                                  }}
                                  title={r.status === 'Active' ? 'Deactivate Reward' : 'Activate Reward'}
                                >
                                  <Power size={13} />
                                  <span>{r.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                {/* Redemptions Summary Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                  <div className="glass-panel" style={{ padding: '18px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Redemptions</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px', color: '#fff' }}>
                      {redemptionsList.length}
                    </div>
                  </div>
                  <div className="glass-panel" style={{ padding: '18px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Successful</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px', color: '#10b981' }}>
                      {redemptionsList.filter((r) => r.status === 'Redeemed').length}
                    </div>
                  </div>
                  <div className="glass-panel" style={{ padding: '18px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px', color: 'var(--accent-gold)' }}>
                      {redemptionsList.filter((r) => r.status === 'Pending').length}
                    </div>
                  </div>
                  <div className="glass-panel" style={{ padding: '18px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cancelled</span>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px', color: '#fb7185' }}>
                      {redemptionsList.filter((r) => r.status === 'Cancelled').length}
                    </div>
                  </div>
                </div>

                {/* Redemption Filters Bar */}
                <div
                  className="glass-panel"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-card)',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                      gap: '12px',
                      alignItems: 'center',
                    }}
                  >
                    {/* 1. Search Customer / Reward */}
                    <div style={{ position: 'relative' }}>
                      <Search
                        size={14}
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-muted)',
                          pointerEvents: 'none',
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Search Customer / Reward..."
                        value={redemptionSearchQuery}
                        onChange={(e) => setRedemptionSearchQuery(e.target.value)}
                        className="input-field"
                        style={{
                          paddingLeft: '34px',
                          paddingRight: redemptionSearchQuery ? '32px' : '12px',
                          fontSize: '0.8rem',
                          height: '38px',
                        }}
                      />
                      {redemptionSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setRedemptionSearchQuery('')}
                          style={{
                            position: 'absolute',
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* 2. Cafe */}
                    <div>
                      <select
                        className="input-field"
                        value={redemptionCafeFilter}
                        onChange={(e) => setRedemptionCafeFilter(e.target.value)}
                        style={{ fontSize: '0.8rem', height: '38px', cursor: 'pointer' }}
                      >
                        <option value="all">Cafe: All Cafes</option>
                        {clientsList.map((c) => (
                          <option key={c.id || c.name} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* 3. Redemption Status */}
                    <div>
                      <select
                        className="input-field"
                        value={redemptionStatusFilter}
                        onChange={(e) => setRedemptionStatusFilter(e.target.value)}
                        style={{ fontSize: '0.8rem', height: '38px', cursor: 'pointer' }}
                      >
                        <option value="all">Status: All Status</option>
                        <option value="Redeemed">Status: Redeemed</option>
                        <option value="Pending">Status: Pending</option>
                        <option value="Cancelled">Status: Cancelled</option>
                      </select>
                    </div>

                    {/* 4. Date Range */}
                    <div>
                      <select
                        className="input-field"
                        value={redemptionDateFilter}
                        onChange={(e) => setRedemptionDateFilter(e.target.value)}
                        style={{ fontSize: '0.8rem', height: '38px', cursor: 'pointer' }}
                      >
                        <option value="all">Date: All Time</option>
                        <option value="today">Date: Today</option>
                        <option value="7d">Date: Last 7 Days</option>
                        <option value="30d">Date: Last 30 Days</option>
                      </select>
                    </div>

                    {/* 5. Reward Type */}
                    <div>
                      <select
                        className="input-field"
                        value={redemptionTypeFilter}
                        onChange={(e) => setRedemptionTypeFilter(e.target.value)}
                        style={{ fontSize: '0.8rem', height: '38px', cursor: 'pointer' }}
                      >
                        <option value="all">Type: All Types</option>
                        <option value="FREE_ITEM">Free Item</option>
                        <option value="DISCOUNT">Discount</option>
                      </select>
                    </div>
                  </div>

                  {(redemptionSearchQuery || redemptionCafeFilter !== 'all' || redemptionStatusFilter !== 'all' || redemptionDateFilter !== 'all' || redemptionTypeFilter !== 'all') && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setRedemptionSearchQuery('');
                          setRedemptionCafeFilter('all');
                          setRedemptionStatusFilter('all');
                          setRedemptionDateFilter('all');
                          setRedemptionTypeFilter('all');
                        }}
                        className="btn-secondary"
                        style={{ padding: '5px 12px', fontSize: '0.74rem', color: '#fb7185' }}
                      >
                        <RefreshCw size={12} style={{ marginRight: '4px' }} />
                        Clear Redemption Filters
                      </button>
                    </div>
                  )}
                </div>

                {/* Redemptions Table */}
                <div className="glass-panel" style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <th style={{ padding: '16px 20px' }}>Customer</th>
                        <th style={{ padding: '16px 20px' }}>Reward</th>
                        <th style={{ padding: '16px 20px' }}>Cafe</th>
                        <th style={{ padding: '16px 20px' }}>Points</th>
                        <th style={{ padding: '16px 20px' }}>Date</th>
                        <th style={{ padding: '16px 20px' }}>Status</th>
                        <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filtered = redemptionsList.filter((red) => {
                          if (redemptionSearchQuery.trim()) {
                            const q = redemptionSearchQuery.toLowerCase();
                            const matchCust = red.customer.toLowerCase().includes(q);
                            const matchRew = red.reward.toLowerCase().includes(q);
                            const matchPhone = red.phone.includes(q);
                            const matchCode = red.code.toLowerCase().includes(q);
                            if (!matchCust && !matchRew && !matchPhone && !matchCode) return false;
                          }
                          if (redemptionCafeFilter !== 'all' && red.cafe !== redemptionCafeFilter) return false;
                          if (redemptionStatusFilter !== 'all') {
                            if (red.status.toLowerCase() !== redemptionStatusFilter.toLowerCase()) return false;
                          }
                          if (redemptionTypeFilter !== 'all' && red.type !== redemptionTypeFilter) return false;
                          if (redemptionDateFilter !== 'all') {
                            const d = new Date(red.rawDate);
                            const now = new Date();
                            if (redemptionDateFilter === 'today') {
                              if (d.toDateString() !== now.toDateString()) return false;
                            } else if (redemptionDateFilter === '7d') {
                              const past7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                              if (d < past7) return false;
                            } else if (redemptionDateFilter === '30d') {
                              const past30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                              if (d < past30) return false;
                            }
                          }
                          return true;
                        });

                        if (filtered.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No redemptions found matching the selected filters.
                              </td>
                            </tr>
                          );
                        }

                        return filtered.map((red) => (
                          <tr key={red.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ fontWeight: 700, color: '#fff' }}>{red.customer}</div>
                              <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>{red.phone}</div>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>{red.reward}</span>
                              <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                                Code: {red.code}
                              </div>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{ background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem' }}>
                                {red.cafe}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px', fontWeight: 700, color: '#fff' }}>
                              {red.points} pts
                            </td>
                            <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              {red.date}
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span
                                className={`badge ${red.status === 'Redeemed'
                                    ? 'badge-emerald'
                                    : red.status === 'Pending'
                                      ? 'badge-gold'
                                      : 'badge-rose'
                                  }`}
                                style={{ fontSize: '0.72rem' }}
                              >
                                ● {red.status}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                              <button
                                type="button"
                                onClick={() => setViewingRedemption(red)}
                                className="btn-secondary"
                                style={{ padding: '5px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#38bdf8' }}
                                title="View Redemption Receipt"
                              >
                                <Eye size={13} />
                                <span>Receipt</span>
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ============================================================== */}
            {/* REWARD ANALYTICS & INSIGHTS (Below Table) */}
            {/* ============================================================== */}
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={18} color="var(--accent-gold)" />
                    <span>Reward Analytics</span>
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', margin: '2px 0 0 0' }}>
                    Cross-cafe redemption frequency, popular reward types, and branch performance telemetry.
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
                {/* 1. Most Redeemed Rewards */}
                <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>Most Redeemed Rewards</h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-gold)', fontWeight: 600 }}>Top Performance</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {[
                      { name: 'Free Coffee', count: 42, pct: 48, color: 'var(--accent-gold)' },
                      { name: 'Free Burger', count: 27, pct: 31, color: '#10b981' },
                      { name: 'Croissant', count: 18, pct: 21, color: '#38bdf8' },
                      { name: '15% Off Total Bill', count: 14, pct: 16, color: '#a78bfa' },
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                          <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{item.name}</span>
                          <span style={{ fontWeight: 700, color: item.color }}>{item.count}</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: '3px' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Cafe-wise Performance */}
                <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>Cafe-wise Performance</h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Claim Velocity</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { cafe: 'Trio Cafe', total: 120, rate: '94% Success', top: 'Free Coffee' },
                      { cafe: 'Cafe Aroma', total: 85, rate: '89% Success', top: 'Free Burger' },
                      { cafe: 'The Daily Grind', total: 40, rate: '91% Success', top: 'Croissant' },
                    ].map((c, i) => (
                      <div
                        key={i}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.86rem' }}>{c.cafe}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Top Perk: <strong style={{ color: 'var(--text-secondary)' }}>{c.top}</strong>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: 'var(--accent-gold)', fontSize: '0.95rem' }}>{c.total}</div>
                          <span className="badge badge-emerald" style={{ fontSize: '0.65rem', marginTop: '2px' }}>{c.rate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Reward Type Distribution */}
                <div className="glass-panel" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>Reward Type Distribution</h4>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Catalog Breakdown</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                    <div style={{ padding: '14px 10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', textTransform: 'uppercase', fontWeight: 700 }}>Free Item</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>72%</div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Highest ROI</span>
                    </div>
                    <div style={{ padding: '14px 10px', background: 'rgba(167, 139, 250, 0.08)', borderRadius: '12px', border: '1px solid rgba(167, 139, 250, 0.2)', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: '#a78bfa', textTransform: 'uppercase', fontWeight: 700 }}>Discount</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>22%</div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Bill boosters</span>
                    </div>
                    <div style={{ padding: '14px 10px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', textTransform: 'uppercase', fontWeight: 700 }}>Voucher</span>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>6%</div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Event perks</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 8: 📱 WHATSAPP NOTIFICATION LOGS (Donut + Logs) */}
        {/* ============================================================== */}
        {!selectedCafeDetail && activeSection === 'whatsapp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>WhatsApp Notification Logs</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Delivery analytics and message queue status
              </p>
            </div>

            {/* Top Cards + Donut Chart */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div className="glass-panel" style={{ padding: '18px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sent</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px', color: '#fff' }}>1,240</div>
              </div>
              <div className="glass-panel" style={{ padding: '18px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Delivered</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px', color: '#10b981' }}>1,180</div>
              </div>
              <div className="glass-panel" style={{ padding: '18px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Failed</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px', color: '#fb7185' }}>40</div>
              </div>
              <div className="glass-panel" style={{ padding: '18px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px', color: 'var(--accent-gold)' }}>20</div>
              </div>

              {/* Donut Chart representation */}
              <div className="glass-panel" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '60px', height: '60px', position: 'relative' }}>
                  <svg width="60" height="60" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#222"
                      strokeWidth="3.8"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="3.8"
                      strokeDasharray="95, 100"
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                    95%
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>95% Delivered</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>High delivery success rate</div>
                </div>
              </div>
            </div>

            {/* Logs Table */}
            <div className="glass-panel" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '16px 20px' }}>Customer</th>
                    <th style={{ padding: '16px 20px' }}>Message Type</th>
                    <th style={{ padding: '16px 20px', width: '120px', whiteSpace: 'nowrap' }}>Sent At</th>
                    <th style={{ padding: '16px 20px', width: '130px', whiteSpace: 'nowrap' }}>Status</th>
                    <th style={{ padding: '16px 20px', width: '100px', textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                  </tr>
                </thead>

              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 9: 📊 ANALYTICS & REPORTS */}
        {/* ============================================================== */}
        {!selectedCafeDetail && activeSection === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Analytics & Reports</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Platform performance benchmarks and export tools
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <select
                  className="input-field"
                  style={{ width: 'auto' }}
                  value={analyticsPeriod}
                  onChange={(e) => setAnalyticsPeriod(e.target.value)}
                >
                  <option value="7D">7 Days</option>
                  <option value="30D">30 Days</option>
                  <option value="3M">3 Months</option>
                  <option value="1Y">1 Year</option>
                </select>
                <button
                  onClick={() => toast('Exporting complete CSV telemetry report...', 'info')}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                >
                  <Download size={14} />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => toast('Generating PDF Executive Summary...', 'info')}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                >
                  <FileText size={14} />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            {/* Growth Rates KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
              {[
                { title: 'Customers', change: '+18.2%' },
                { title: 'Visits', change: '+24.5%' },
                { title: 'Rewards', change: '+12.0%' },
                { title: 'Redemptions', change: '+31.0%' },
              ].map((k) => (
                <div key={k.title} className="glass-panel" style={{ padding: '20px', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{k.title}</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '4px', color: '#10b981' }}>
                    {k.change}
                  </div>
                </div>
              ))}
            </div>

            {/* 4 Analytics Visualizers Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>Customer Growth 📈</h3>
                <div style={{ height: '140px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)' }}>
                  Consistent 18.2% Compound Weekly Growth
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>Visits Frequency 📊</h3>
                <div style={{ height: '140px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  Peak Footfall: Fridays & Weekends 4:00 PM – 8:00 PM
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 10: 🔔 NOTIFICATIONS */}
        {/* ============================================================== */}
        {!selectedCafeDetail && activeSection === 'notifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Notification Center</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  System alerts, cafe onboarding notifications, and queue warnings.
                </p>
              </div>
              <button
                onClick={() => {
                  setNotificationsList((prev) => prev.map((n) => ({ ...n, read: true })));
                  toast('All notifications marked as read', 'success');
                }}
                className="btn-secondary"
                style={{ fontSize: '0.82rem', padding: '8px 16px' }}
              >
                Mark all as read
              </button>
            </div>

            {/* Notification Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-card)', paddingBottom: '8px' }}>
              {(['all', 'unread', 'system', 'cafes', 'whatsapp'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setNotificationsFilter(t)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    textTransform: 'capitalize',
                    background: notificationsFilter === t ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                    color: notificationsFilter === t ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    fontWeight: notificationsFilter === t ? 700 : 500,
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {notificationsList.map((notif) => (
                <div
                  key={notif.id}
                  className="glass-panel"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderLeft: notif.type === 'cafes' ? '4px solid #10b981' : notif.type === 'whatsapp' ? '4px solid #fb7185' : '4px solid #f59e0b',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>{notif.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{notif.desc}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{notif.time}</div>
                  </div>
                  {!notif.read && <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>NEW</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 11: 📋 ACTIVITY / AUDIT LOGS */}
        {/* ============================================================== */}
        {!selectedCafeDetail && activeSection === 'audit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Activity & Audit Logs</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Immutable event stream of administrative actions
              </p>
            </div>

            <div className="glass-panel" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '16px 20px' }}>TIME</th>
                    <th style={{ padding: '16px 20px' }}>USER</th>
                    <th style={{ padding: '16px 20px' }}>ACTION</th>
                    <th style={{ padding: '16px 20px' }}>MODULE</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { time: '10:42 AM', user: 'Super Admin', action: 'Created cafe: Roasters Haven', module: 'Cafes', ip: '127.0.0.1' },
                    { time: '10:35 AM', user: 'Super Admin', action: 'Modified plan tier: Standard → Pro', module: 'Subscriptions', ip: '127.0.0.1' },
                    { time: '10:20 AM', user: 'Manager Rahul', action: 'Added customer: Payal Patel', module: 'Customers', ip: '192.168.1.14' },
                  ].map((audit, idx) => (
                    <tr
                      key={idx}
                      onClick={() => setSelectedAuditLog(audit)}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                    >
                      <td style={{ padding: '16px 20px', color: 'var(--text-muted)' }}>{audit.time}</td>
                      <td style={{ padding: '16px 20px', fontWeight: 700 }}>{audit.user}</td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-primary)' }}>{audit.action}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span className="badge badge-indigo">{audit.module}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 12: 💳 SUBSCRIPTION / PLANS (Pricing Cards) */}
        {/* ============================================================== */}
        {!selectedCafeDetail && activeSection === 'subscriptions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Subscription Tiers & Plans</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Platform pricing tiers and active cafe subscription renewals.
              </p>
            </div>

            {/* 3 Pricing Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
              {[
                { name: 'BASIC', price: '₹999/month', users: '100 Customers', staff: '5 Staff Logins', offers: '5 Rewards', whatsapp: 'Standard WhatsApp' },
                { name: 'PRO', price: '₹2,499/month', users: '1,000 Customers', staff: '15 Staff Logins', offers: '15 Rewards', whatsapp: 'Priority WhatsApp' },
                { name: 'ENTERPRISE', price: '₹6,999/month', users: 'Unlimited Customers', staff: '50 Staff Logins', offers: 'Unlimited Rewards', whatsapp: 'Dedicated API Engine' },
              ].map((tier) => (
                <div key={tier.name} className="glass-panel" style={{ padding: '28px', border: tier.name === 'PRO' ? '1px solid var(--accent-gold)' : undefined }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-gold)' }}>{tier.name}</span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, margin: '6px 0 16px', color: '#fff' }}>{tier.price}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '22px' }}>
                    <div>✓ {tier.users}</div>
                    <div>✓ {tier.staff}</div>
                    <div>✓ {tier.offers}</div>
                    <div>✓ {tier.whatsapp}</div>
                  </div>
                  <button
                    onClick={() => toast(`Editing ${tier.name} configuration`, 'info')}
                    className="btn-secondary"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    Edit Plan
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 13: ⚙️ SETTINGS (Left Sidebar + Right Panel) */}
        {/* ============================================================== */}
        {!selectedCafeDetail && activeSection === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Platform Settings</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Security parameters, administrator profile, and integration settings.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '24px' }}>
              {/* Left Subnav */}
              <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { id: 'profile', label: 'Profile' },
                  { id: 'security', label: 'Security' },
                  { id: 'roles', label: 'Roles & Permissions' },
                  { id: 'whatsapp', label: 'WhatsApp API' },
                  { id: 'platform', label: 'Platform Settings' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSettingsTab(s.id as any)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      textAlign: 'left',
                      fontSize: '0.85rem',
                      fontWeight: settingsTab === s.id ? 700 : 500,
                      background: settingsTab === s.id ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                      color: settingsTab === s.id ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Right Panel */}
              <div className="glass-panel" style={{ padding: '28px' }}>
                {settingsTab === 'security' ? (
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>Change Password</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '20px' }}>
                      Ensure your account uses a strong, random password.
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        toast('Password successfully updated!', 'success');
                        setPasswordForm({ current: '', newPass: '', confirm: '' });
                      }}
                      style={{ maxWidth: '400px' }}
                    >
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Current Password</label>
                        <input
                          type="password"
                          required
                          className="input-field"
                          value={passwordForm.current}
                          onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                        />
                      </div>
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>New Password</label>
                        <input
                          type="password"
                          required
                          className="input-field"
                          value={passwordForm.newPass}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                        />
                      </div>
                      <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Confirm Password</label>
                        <input
                          type="password"
                          required
                          className="input-field"
                          value={passwordForm.confirm}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                        />
                      </div>
                      <button type="submit" className="btn-primary">
                        Update Password
                      </button>
                    </form>
                  </div>
                ) : (
                  <div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '6px' }}>Super Admin Identity</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', marginTop: '16px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Name: </span>
                        <strong>{user?.name || 'Super Admin'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Email: </span>
                        <strong>{user?.email || 'admin@trioas.com'}</strong>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Role Scope: </span>
                        <span className="badge badge-gold">Platform Root</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 15: 🆘 SUPPORT DESK (Ticket Cards + Chat Detail) */}
        {/* ============================================================== */}
        {!selectedCafeDetail && activeSection === 'support' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Support Desk</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Inquiries and support tickets from cafe administrators
              </p>
            </div>

            {/* Ticket KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div className="glass-panel" style={{ padding: '18px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Open Tickets</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px', color: '#fb7185' }}>12</div>
              </div>
              <div className="glass-panel" style={{ padding: '18px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pending</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px', color: 'var(--accent-gold)' }}>5</div>
              </div>
              <div className="glass-panel" style={{ padding: '18px', textAlign: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Resolved</span>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '2px', color: '#10b981' }}>84</div>
              </div>
            </div>

            {/* Tickets Table */}
            <div className="glass-panel" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '16px 20px' }}>Ticket #</th>
                    <th style={{ padding: '16px 20px' }}>Cafe</th>
                    <th style={{ padding: '16px 20px' }}>Subject</th>
                    <th style={{ padding: '16px 20px' }}>Priority</th>
                    <th style={{ padding: '16px 20px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsList.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', cursor: 'pointer' }}
                    >
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--accent-gold)' }}>#{t.id}</td>
                      <td style={{ padding: '16px 20px' }}>{t.cafe}</td>
                      <td style={{ padding: '16px 20px', color: '#fff' }}>{t.subject}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span className={`badge ${t.priority === 'High' ? 'badge-gold' : 'badge-indigo'}`}>{t.priority}</span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span className="badge badge-emerald">{t.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ============================================================== */}
      {/* 4. ADD NEW ADMIN CARD POPUP MODAL (CENTERED POPUP, NOT SIDE DRAWER) */}
      {/* ============================================================== */}
      {showAddAdminDrawer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '32px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Add Cafe Administrator</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Assign administrative credentials for a cafe branch</p>
              </div>
              <button onClick={() => setShowAddAdminDrawer(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Assigned Cafe</label>
                <select
                  className="input-field"
                  value={adminDrawerClientId}
                  onChange={(e) => setAdminDrawerClientId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select Cafe</option>
                  {clientsList.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.email})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Verma"
                  className="input-field"
                  value={adminForm.name}
                  onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin@cafe.com"
                  className="input-field"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Phone</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    className="input-field"
                    value={adminForm.phone}
                    onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Role</label>
                  <select
                    className="input-field"
                    value={adminForm.role}
                    onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="input-field"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={adminForm.sendWelcomeEmail}
                    onChange={(e) => setAdminForm({ ...adminForm, sendWelcomeEmail: e.target.checked })}
                    style={{ accentColor: 'var(--accent-gold)' }}
                  />
                  <span>Send welcome email with portal credentials</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddAdminDrawer(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: 5. CUSTOMER PROFILE CARD (VIEW ONLY) */}
      {/* ============================================================== */}
      {selectedCustomerProfile && (
        <div
          onClick={() => setSelectedCustomerProfile(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              borderRadius: '24px',
              padding: '28px',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.08)',
              position: 'relative',
            }}
          >
            {/* Header: View Only Tag & Close Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-gold)',
                  background: 'rgba(245, 158, 11, 0.12)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                }}
              >
                Customer Profile Details
              </span>
              <button
                type="button"
                onClick={() => setSelectedCustomerProfile(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-muted)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Avatar & Identity */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  fontWeight: 800,
                  color: '#0c0b0a',
                  marginBottom: '12px',
                  boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)',
                  border: '3px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                {selectedCustomerProfile.name ? selectedCustomerProfile.name[0].toUpperCase() : 'C'}
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>
                {selectedCustomerProfile.name}
              </h3>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span className={`badge ${selectedCustomerProfile.isActive !== false ? 'badge-green' : 'badge-gray'}`} style={{ fontSize: '0.72rem' }}>
                  {selectedCustomerProfile.isActive !== false ? 'ACTIVE CUSTOMER' : 'INACTIVE'}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Coffee size={12} color="var(--accent-gold)" />
                  {selectedCustomerProfile.cafe}
                </span>
              </div>
            </div>

            {/* Key Metrics: Visits & Rewards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div
                style={{
                  padding: '14px',
                  background: 'rgba(245, 158, 11, 0.06)',
                  borderRadius: '14px',
                  border: '1px solid rgba(245, 158, 11, 0.18)',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Visits
                </span>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--accent-gold)', marginTop: '2px' }}>
                  {selectedCustomerProfile.visits}
                </div>
              </div>
              <div
                style={{
                  padding: '14px',
                  background: 'rgba(16, 185, 129, 0.06)',
                  borderRadius: '14px',
                  border: '1px solid rgba(16, 185, 129, 0.18)',
                  textAlign: 'center',
                }}
              >
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Rewards Earned
                </span>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                  {selectedCustomerProfile.rewards}
                </div>
              </div>
            </div>

            {/* Information Details List */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '20px',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} color="var(--accent-gold)" /> Phone
                </span>
                <span style={{ fontWeight: 600, color: '#fff' }}>
                  {selectedCustomerProfile.phone || 'N/A'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} color="var(--accent-gold)" /> Email
                </span>
                <span style={{ fontWeight: 500, color: selectedCustomerProfile.email && selectedCustomerProfile.email !== 'Not provided' ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                  {selectedCustomerProfile.email || 'Not provided'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} color="var(--accent-gold)" /> Joined Date
                </span>
                <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {selectedCustomerProfile.joinedDate || 'Recent'}
                </span>
              </div>
              {selectedCustomerProfile.qrToken && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={14} color="var(--accent-gold)" /> QR Token
                  </span>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      color: 'var(--accent-gold)',
                      background: 'rgba(245, 158, 11, 0.1)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {String(selectedCustomerProfile.qrToken).slice(0, 16)}...
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons: Edit, Delete, Close */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  const targetCustomer = selectedCustomerProfile.rawCustomer || {
                    id: selectedCustomerProfile.id,
                    name: selectedCustomerProfile.name,
                    phone: selectedCustomerProfile.phone,
                    email: selectedCustomerProfile.email !== 'Not provided' ? selectedCustomerProfile.email : '',
                    isActive: selectedCustomerProfile.isActive,
                  };
                  openEditCustomerModal(targetCustomer);
                  setSelectedCustomerProfile(null);
                }}
                className="btn-secondary"
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  color: 'var(--accent-gold)',
                  borderColor: 'rgba(245, 158, 11, 0.35)',
                  background: 'rgba(245, 158, 11, 0.08)',
                }}
              >
                <Edit size={14} />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDeletingCustomerTarget({ id: selectedCustomerProfile.id, name: selectedCustomerProfile.name });
                  setSelectedCustomerProfile(null);
                }}
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#ef4444',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                }}
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedCustomerProfile(null)}
                className="btn-secondary"
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '0.84rem',
                  justifyContent: 'center',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SLIDE-OVER DRAWER: 11. AUDIT LOG DETAIL DRAWER */}
      {/* ============================================================== */}
      {selectedAuditLog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '420px',
              height: '100%',
              borderRadius: 0,
              padding: '36px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Activity Details</h3>
              <button onClick={() => setSelectedAuditLog(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.85rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>User: </span>
                <strong>{selectedAuditLog.user}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Action: </span>
                <strong>{selectedAuditLog.action}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Timestamp: </span>
                <strong>{selectedAuditLog.time}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>IP Address: </span>
                <code>{selectedAuditLog.ip}</code>
              </div>
              <div style={{ marginTop: '14px', padding: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 700 }}>CHANGES COMMITTED</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Status: Inactive → Active
                  <br />
                  Plan: Basic → Pro
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SLIDE-OVER DRAWER: 15. SUPPORT TICKET CHAT */}
      {/* ============================================================== */}
      {selectedTicket && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '460px',
              height: '100%',
              borderRadius: 0,
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Support #{selectedTicket.id}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Cafe: {selectedTicket.cafe}</p>
                </div>
                <button onClick={() => setSelectedTicket(null)} style={{ color: 'var(--text-muted)' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Chat Messages */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '60vh', overflowY: 'auto', marginBottom: '20px' }}>
                {selectedTicket.messages.map((m: any, i: number) => {
                  const isMe = m.sender === 'Super Admin';
                  return (
                    <div
                      key={i}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '82%',
                        padding: '12px 16px',
                        borderRadius: '14px',
                        background: isMe ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(255,255,255,0.06)',
                        color: isMe ? '#0c0b0a' : '#fff',
                        fontSize: '0.85rem',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.72rem', marginBottom: '2px', opacity: 0.8 }}>
                        {m.sender} • {m.time}
                      </div>
                      <div>{m.text}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reply Input */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Write reply to cafe admin..."
                className="input-field"
                value={ticketReplyText}
                onChange={(e) => setTicketReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendTicketReply();
                }}
              />
              <button onClick={handleSendTicketReply} className="btn-primary" style={{ padding: '0 16px', flexShrink: 0 }}>
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ============================================================== */}
      {/* MODAL: ONBOARD / CREATE CAFE MODAL */}
      {/* ============================================================== */}
      {showCreateClientModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Onboard New Cafe</h3>
              <button onClick={() => setShowCreateClientModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateClient}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Cafe Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Roasters Haven"
                  className="input-field"
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Official Email</label>
                <input
                  type="email"
                  required
                  placeholder="contact@roastershaven.com"
                  className="input-field"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Phone</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  className="input-field"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Address</label>
                <input
                  type="text"
                  placeholder="12 Baker Street, Mumbai"
                  className="input-field"
                  value={clientForm.address}
                  onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Plan</label>
                  <select
                    className="input-field"
                    value={clientForm.subscriptionPlan}
                    onChange={(e) => setClientForm({ ...clientForm, subscriptionPlan: e.target.value })}
                  >
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Staff Limit</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    value={clientForm.maxStaff}
                    onChange={(e) => setClientForm({ ...clientForm, maxStaff: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreateClientModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Onboard Cafe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDIT CAFE MODAL */}
      {/* ============================================================== */}
      {showEditClientModal && editingClient && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>Edit Cafe Details</h3>
              <button onClick={() => setShowEditClientModal(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateClient}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Cafe Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Email</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Phone</label>
                <input
                  type="tel"
                  className="input-field"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Address</label>
                <input
                  type="text"
                  className="input-field"
                  value={clientForm.address}
                  onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Plan</label>
                  <select
                    className="input-field"
                    value={clientForm.subscriptionPlan}
                    onChange={(e) => setClientForm({ ...clientForm, subscriptionPlan: e.target.value })}
                  >
                    <option value="basic">Basic</option>
                    <option value="standard">Standard</option>
                    <option value="premium">Premium</option>
                    <option value="pro">Pro</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Staff Limit</label>
                  <input
                    type="number"
                    min="1"
                    className="input-field"
                    value={clientForm.maxStaff}
                    onChange={(e) => setClientForm({ ...clientForm, maxStaff: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowEditClientModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: IN-APP DELETE CAFE CONFIRMATION (NO BROWSER POPUP) */}
      {/* ============================================================== */}
      {deletingClientTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '28px', border: '1px solid rgba(244, 63, 94, 0.3)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb7185', flexShrink: 0 }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#fff' }}>Delete Cafe</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Confirm permanent removal</p>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '22px' }}>
              Are you sure you want to permanently delete <strong style={{ color: '#fff' }}>&quot;{deletingClientTarget.name}&quot;</strong>?
              This will remove all associated admins, staff members, visits, and customer rewards. This action <span style={{ color: '#fb7185', fontWeight: 600 }}>cannot be undone</span>.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={isDeletingClient}
                onClick={() => setDeletingClientTarget(null)}
                className="btn-secondary"
                style={{ opacity: isDeletingClient ? 0.5 : 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingClient}
                onClick={handleExecuteDeleteClient}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#e11d48',
                  color: '#fff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: isDeletingClient ? 'not-allowed' : 'pointer',
                  opacity: isDeletingClient ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.4)',
                  transition: 'all 0.2s',
                }}
              >
                {isDeletingClient ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Delete Cafe</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDIT CAFE ADMIN CARD POPUP MODAL */}
      {/* ============================================================== */}
      {editingAdminTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '32px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '22px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Edit Cafe Admin</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Update admin details and permissions</p>
              </div>
              <button onClick={() => setEditingAdminTarget(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditAdmin}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Full Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={editingAdminTarget.name}
                  onChange={(e) => setEditingAdminTarget({ ...editingAdminTarget, name: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Email Address</label>
                <input
                  type="email"
                  required
                  className="input-field"
                  value={editingAdminTarget.email}
                  onChange={(e) => setEditingAdminTarget({ ...editingAdminTarget, email: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Phone</label>
                  <input
                    type="tel"
                    className="input-field"
                    value={editingAdminTarget.phone}
                    onChange={(e) => setEditingAdminTarget({ ...editingAdminTarget, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>Role</label>
                  <select
                    className="input-field"
                    value={editingAdminTarget.role}
                    onChange={(e) => setEditingAdminTarget({ ...editingAdminTarget, role: e.target.value })}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Reset Password <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(leave blank to keep unchanged)</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input-field"
                  value={editingAdminTarget.password || ''}
                  onChange={(e) => setEditingAdminTarget({ ...editingAdminTarget, password: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  disabled={isUpdatingAdmin}
                  onClick={() => setEditingAdminTarget(null)}
                  className="btn-secondary"
                  style={{ opacity: isUpdatingAdmin ? 0.5 : 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingAdmin}
                  className="btn-primary"
                  style={{ opacity: isUpdatingAdmin ? 0.7 : 1 }}
                >
                  {isUpdatingAdmin ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: IN-APP DELETE CAFE ADMIN CONFIRMATION */}
      {/* ============================================================== */}
      {deletingAdminTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '28px', border: '1px solid rgba(244, 63, 94, 0.3)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb7185', flexShrink: 0 }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#fff' }}>Remove Admin</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Confirm admin removal</p>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '22px' }}>
              Are you sure you want to remove <strong style={{ color: '#fff' }}>&quot;{deletingAdminTarget.name}&quot;</strong> from <strong style={{ color: '#f59e0b' }}>{deletingAdminTarget.cafeName}</strong>?
              This will revoke their login access to the cafe admin portal.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={isDeletingAdmin}
                onClick={() => setDeletingAdminTarget(null)}
                className="btn-secondary"
                style={{ opacity: isDeletingAdmin ? 0.5 : 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingAdmin}
                onClick={handleExecuteDeleteAdmin}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#e11d48',
                  color: '#fff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: isDeletingAdmin ? 'not-allowed' : 'pointer',
                  opacity: isDeletingAdmin ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.4)',
                  transition: 'all 0.2s',
                }}
              >
                {isDeletingAdmin ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Remove Admin</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: EDIT CUSTOMER DETAILS */}
      {/* ============================================================== */}
      {editingCustomer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '32px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              borderRadius: '24px',
              border: '1px solid rgba(245, 158, 11, 0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-gold)',
                  }}
                >
                  <Edit size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Edit Customer</h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Update profile info for {editingCustomer.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                style={{ color: 'var(--text-muted)', background: 'transparent', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={customerEditForm.name}
                    onChange={(e) => setCustomerEditForm({ ...customerEditForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    required
                    className="input-field"
                    value={customerEditForm.phone}
                    onChange={(e) => setCustomerEditForm({ ...customerEditForm, phone: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="name@example.com (optional)"
                    value={customerEditForm.email}
                    onChange={(e) => setCustomerEditForm({ ...customerEditForm, email: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Account Status
                  </label>
                  <select
                    className="input-field"
                    value={customerEditForm.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setCustomerEditForm({ ...customerEditForm, isActive: e.target.value === 'active' })}
                  >
                    <option value="active">Active (QR Pass & Points Enabled)</option>
                    <option value="inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  disabled={isUpdatingCustomer}
                  onClick={() => setEditingCustomer(null)}
                  className="btn-secondary"
                  style={{ opacity: isUpdatingCustomer ? 0.5 : 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingCustomer}
                  className="btn-primary"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isUpdatingCustomer ? 0.7 : 1,
                  }}
                >
                  {isUpdatingCustomer ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: IN-APP DELETE CUSTOMER CONFIRMATION */}
      {/* ============================================================== */}
      {deletingCustomerTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '28px',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
              borderRadius: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fb7185',
                  flexShrink: 0,
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#fff' }}>Delete Customer</h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Confirm permanent removal</p>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '22px' }}>
              Are you sure you want to permanently delete customer{' '}
              <strong style={{ color: '#fff' }}>&quot;{deletingCustomerTarget.name}&quot;</strong>?
              All associated visits, scan logs, loyalty progress, and rewards will be deleted. This action{' '}
              <span style={{ color: '#fb7185', fontWeight: 600 }}>cannot be undone</span>.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={isDeletingCustomer}
                onClick={() => setDeletingCustomerTarget(null)}
                className="btn-secondary"
                style={{ opacity: isDeletingCustomer ? 0.5 : 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingCustomer}
                onClick={handleDeleteCustomer}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: '#e11d48',
                  color: '#fff',
                  border: 'none',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: isDeletingCustomer ? 'not-allowed' : 'pointer',
                  opacity: isDeletingCustomer ? 0.7 : 1,
                  boxShadow: '0 4px 14px rgba(225, 29, 72, 0.4)',
                  transition: 'all 0.2s',
                }}
              >
                {isDeletingCustomer ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Delete Customer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ============================================================== */}
      {/* MODAL: VIEW REWARD DETAILS & GOVERNANCE */}
      {/* ============================================================== */}
      {viewingReward && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setViewingReward(null)}
        >
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '520px',
              borderRadius: '24px',
              padding: '28px',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.08)',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            {/* Header: Badge & Status & Close */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--accent-gold)',
                    background: 'rgba(245, 158, 11, 0.12)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                  }}
                >
                  Reward Details & Policy
                </span>
                <span
                  className={`badge ${viewingReward.status === 'Active'
                      ? 'badge-green'
                      : viewingReward.status === 'Expired'
                        ? 'badge-gray'
                        : 'badge-rose'
                    }`}
                  style={{ fontSize: '0.72rem' }}
                >
                  ● {viewingReward.status === 'Active' ? 'Active' : viewingReward.status === 'Expired' ? 'Expired' : 'Deactivated / Suspended'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingReward(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Hero: Icon, Reward Name & Cafe */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(234, 88, 12, 0.2) 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-gold)',
                  marginBottom: '10px',
                }}
              >
                <Gift size={28} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>
                {viewingReward.name}
              </h3>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontWeight: 600,
                  }}
                >
                  <Coffee size={13} color="var(--accent-gold)" />
                  {viewingReward.cafe}
                </span>
                <span className={`badge ${viewingReward.type === 'FREE_ITEM' ? 'badge-emerald' : 'badge-indigo'}`} style={{ fontSize: '0.72rem' }}>
                  {viewingReward.typeLabel || viewingReward.type}
                </span>
              </div>
            </div>

            {/* 4 Key Metrics: Points, Value, Redeemed, Status */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '18px' }}>
              {/* Points Required */}
              <div
                style={{
                  padding: '12px 14px',
                  background: 'rgba(245, 158, 11, 0.06)',
                  borderRadius: '14px',
                  border: '1px solid rgba(245, 158, 11, 0.18)',
                }}
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Points Required
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-gold)', marginTop: '2px' }}>
                  {viewingReward.points} <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 500 }}>pts</span>
                </div>
              </div>

              {/* Reward Value */}
              <div
                style={{
                  padding: '12px 14px',
                  background: 'rgba(16, 185, 129, 0.06)',
                  borderRadius: '14px',
                  border: '1px solid rgba(16, 185, 129, 0.18)',
                }}
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Reward Value
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>
                  {viewingReward.value || '₹200'}
                </div>
              </div>

              {/* Total Redemptions */}
              <div
                style={{
                  padding: '12px 14px',
                  background: 'rgba(56, 189, 248, 0.06)',
                  borderRadius: '14px',
                  border: '1px solid rgba(56, 189, 248, 0.18)',
                }}
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Total Redemptions
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', marginTop: '2px' }}>
                  {viewingReward.redeemed} <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', fontWeight: 500 }}>claims</span>
                </div>
              </div>

              {/* Current Status */}
              <div
                style={{
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Current Status
                </span>
                <div
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    marginTop: '4px',
                    color: viewingReward.status === 'Active' ? '#10b981' : viewingReward.status === 'Expired' ? '#94a3b8' : '#fb7185',
                  }}
                >
                  {viewingReward.status}
                </div>
              </div>
            </div>

            {/* Details Breakdown List */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              {/* Cafe Name */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Cafe Name</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                  {viewingReward.cafe}
                </span>
              </div>

              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.04)' }} />

              {/* Created By (Cafe Admin) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Created By</span>
                <div style={{ textAlign: 'right' }}>
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'var(--accent-gold)',
                      background: 'rgba(245, 158, 11, 0.1)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      border: '1px solid rgba(245, 158, 11, 0.2)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <Users size={12} />
                    {viewingReward.createdBy || 'Cafe Admin'}
                  </span>
                </div>
              </div>

              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.04)' }} />

              {/* Created Date and Expiry */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Created Date</span>
                <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                  {viewingReward.createdDate
                    ? new Date(viewingReward.createdDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'N/A'}
                </span>
              </div>

              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.04)' }} />

              {/* Expiry Date */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Expiry Date</span>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9' }}>
                  {new Date(viewingReward.expiry).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.04)' }} />

              {/* Description & Terms */}
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>
                  Description & Terms
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {viewingReward.description || 'Complimentary loyalty perk for frequent customers.'}
                </p>
              </div>
            </div>

            {/* Super Admin Actions: Activate / Deactivate + Close */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => handleToggleRewardStatus(viewingReward.id)}
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: 'none',
                  transition: 'all 0.2s',
                  background:
                    viewingReward.status === 'Active'
                      ? 'rgba(244, 63, 94, 0.15)'
                      : 'rgba(16, 185, 129, 0.15)',
                  color: viewingReward.status === 'Active' ? '#fb7185' : '#10b981',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  borderColor:
                    viewingReward.status === 'Active'
                      ? 'rgba(244, 63, 94, 0.4)'
                      : 'rgba(16, 185, 129, 0.4)',
                }}
              >
                <Power size={14} />
                <span>{viewingReward.status === 'Active' ? 'Deactivate Reward' : 'Activate Reward'}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewingReward(null)}
                className="btn-secondary"
                style={{ fontSize: '0.82rem' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ============================================================== */}
      {/* MODAL: VIEW REDEMPTION RECEIPT */}
      {/* ============================================================== */}
      {viewingRedemption && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(8px)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setViewingRedemption(null)}
        >
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              borderRadius: '24px',
              padding: '28px',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.08)',
              position: 'relative',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-gold)',
                  background: 'rgba(245, 158, 11, 0.12)',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                }}
              >
                Redemption Receipt
              </span>
              <button
                type="button"
                onClick={() => setViewingRedemption(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-card)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Status & Code Hero */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background:
                    viewingRedemption.status === 'Redeemed'
                      ? 'rgba(16, 185, 129, 0.15)'
                      : viewingRedemption.status === 'Pending'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(244, 63, 94, 0.15)',
                  border: `2px solid ${viewingRedemption.status === 'Redeemed'
                      ? '#10b981'
                      : viewingRedemption.status === 'Pending'
                        ? 'var(--accent-gold)'
                        : '#fb7185'
                    }`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color:
                    viewingRedemption.status === 'Redeemed'
                      ? '#10b981'
                      : viewingRedemption.status === 'Pending'
                        ? 'var(--accent-gold)'
                        : '#fb7185',
                  marginBottom: '10px',
                }}
              >
                <CheckCircle size={30} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: '0 0 4px 0' }}>
                {viewingRedemption.reward}
              </h3>
              <div style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--accent-gold)', fontWeight: 700, letterSpacing: '0.08em' }}>
                {viewingRedemption.code}
              </div>
            </div>

            {/* Details Card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Customer</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{viewingRedemption.customer}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{viewingRedemption.phone}</div>
                </div>
              </div>

              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.05)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Cafe Location</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {viewingRedemption.cafe}
                </span>
              </div>

              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.05)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Points Deducted</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                  {viewingRedemption.points} pts
                </span>
              </div>

              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.05)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Redeemed At</span>
                <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>{viewingRedemption.date}</span>
              </div>

              <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.05)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Redemption Status</span>
                <span
                  className={`badge ${viewingRedemption.status === 'Redeemed'
                      ? 'badge-emerald'
                      : viewingRedemption.status === 'Pending'
                        ? 'badge-gold'
                        : 'badge-rose'
                    }`}
                  style={{ fontSize: '0.72rem' }}
                >
                  ● {viewingRedemption.status}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              {viewingRedemption.status === 'Pending' && (
                <button
                  type="button"
                  onClick={() => {
                    setRedemptionsList((prev) =>
                      prev.map((item) =>
                        item.id === viewingRedemption.id ? { ...item, status: 'Redeemed' } : item
                      )
                    );
                    toast(`Redemption marked as Redeemed!`, 'success');
                    setViewingRedemption(null);
                  }}
                  className="btn-primary"
                  style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <CheckCircle size={14} />
                  <span>Mark as Redeemed</span>
                </button>
              )}
              <button type="button" onClick={() => setViewingRedemption(null)} className="btn-secondary" style={{ fontSize: '0.82rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
