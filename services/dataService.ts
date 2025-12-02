

import { Property, Client, Task, Commission, User, AIKeyConfig } from '../types';

// --- Mock Data Generators ---
const MOCK_PROPERTIES: Property[] = [
    {
        id: 'prop-1',
        category: 'residential',
        type: 'آپارتمان',
        transactionType: 'sale',
        title: 'آپارتمان مدرن در نیاوران',
        address: 'تهران، نیاوران، خیابان مژده',
        area: 145,
        priceTotal: 12500000000,
        features: ['استخر', 'سونا', 'جکوزی', 'رواف گاردن'],
        images: ['https://images.unsplash.com/photo-1600596542815-2495db9dc2c3?auto=format&fit=crop&w=800&q=80'],
        ownerName: 'آقای رضایی',
        ownerPhone: '09121234567',
        description: 'واحدی بسیار خوش نقشه با نورگیر عالی در بهترین لوکیشن نیاوران. متریال برند اروپایی.',
        date: '1403/02/15',
        lat: 35.8123,
        lng: 51.4678,
        bedrooms: 3,
        yearBuilt: 1399,
        hasElevator: true, hasParking: true, hasStorage: true, deedStatus: 'تک‌برگ'
    },
    {
        id: 'prop-2',
        category: 'commercial',
        type: 'مغازه',
        transactionType: 'rent',
        title: 'مغازه تجاری بر اصلی سعادت آباد',
        address: 'تهران، سعادت آباد، بلوار دریا',
        area: 45,
        priceDeposit: 500000000,
        priceRent: 85000000,
        features: ['تابلو خور عالی', 'شیشه میرال', 'ارتفاع سقف ۴ متر'],
        images: ['https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80'],
        ownerName: 'خانم کمالی',
        ownerPhone: '09129876543',
        description: 'موقعیت استثنایی برای برندها، پاخور عالی، دید کامل از خیابان.',
        date: '1403/02/18',
        lat: 35.7789,
        lng: 51.3654,
        status: 'تخلیه',
        facilities: ['آب', 'برق', 'تلفن', 'کرکره برقی'],
        locationType: 'بر خیابان اصلی'
    },
    {
        id: 'prop-3',
        category: 'residential',
        type: 'ویلا',
        transactionType: 'sale',
        title: 'ویلا باغ لاکچری در لواسان',
        address: 'لواسان، بلوار امام خمینی',
        area: 500,
        priceTotal: 85000000000,
        features: ['محوطه سازی', 'آلاچیق', 'باربیکیو'],
        images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80'],
        ownerName: 'مهندس تهرانی',
        ownerPhone: '09121112233',
        description: 'ویلای شخصی ساز با بهترین متریال، سند شاهنشاهی، پایان کار.',
        date: '1403/02/20',
        lat: 35.8189,
        lng: 51.6321,
        bedrooms: 4,
        yearBuilt: 1401,
        hasParking: true,
        deedStatus: 'تک‌برگ'
    },
    {
        id: 'prop-test-empty',
        category: 'residential',
        type: 'آپارتمان',
        transactionType: 'sale',
        title: 'آپارتمان خام (تست چیدمان)',
        address: 'تهران، فرمانیه',
        area: 120,
        priceTotal: 9000000000,
        features: ['کلید نخورده'],
        images: ['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'],
        ownerName: 'تست سیستم',
        ownerPhone: '---',
        description: 'این ملک برای تست قابلیت چیدمان مجازی (Virtual Staging) اضافه شده است. عکس سالن خالی است.',
        date: '1403/03/01',
        lat: 35.8000,
        lng: 51.4500,
        bedrooms: 2,
        yearBuilt: 1403
    },
    {
        id: 'prop-test-shop',
        category: 'commercial',
        type: 'مغازه',
        transactionType: 'rent',
        title: 'مغازه فلت (تست دکور)',
        address: 'تهران، پاسداران',
        area: 30,
        priceDeposit: 200000000,
        priceRent: 40000000,
        features: [],
        images: ['https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?auto=format&fit=crop&w=800&q=80'],
        ownerName: 'تست سیستم',
        ownerPhone: '---',
        description: 'این ملک برای تست چیدمان تجاری (کافه/آرایشگاه) اضافه شده است.',
        date: '1403/03/01',
        lat: 35.7600,
        lng: 51.4600
    }
];

const MOCK_USERS: User[] = [
    { id: 'admin-1', name: 'امیر سیدی (مدیر)', username: 'admin', role: 'admin', lat: 35.6892, lng: 51.3890 },
    { id: 'sec-1', name: 'منشی دفتر', username: 'secretary', role: 'secretary', lat: 35.7219, lng: 51.3347, last_seen: '۱۴۰۳/۰۵/۱۰ ۱۲:۳۰' }
];

// --- Local Storage Helpers ---

const STORAGE_KEYS = {
    PROPERTIES: 'properties',
    CLIENTS: 'clients',
    TASKS: 'tasks',
    COMMISSIONS: 'commissions',
    SETTINGS: 'app_settings',
    USERS: 'users_list'
};

// --- CRUD Operations ---

// Properties
export const getProperties = async (): Promise<Property[]> => {
    const stored = localStorage.getItem(STORAGE_KEYS.PROPERTIES);
    if (stored) return JSON.parse(stored);
    // Initialize with Mock Data if empty
    localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(MOCK_PROPERTIES));
    return MOCK_PROPERTIES;
};

export const saveProperty = async (property: Partial<Property>): Promise<Property[]> => {
    const current = await getProperties();
    let updated = [];
    if (property.id) {
        updated = current.map(p => p.id === property.id ? { ...p, ...property } as Property : p);
    } else {
        const newProp = { ...property, id: Date.now().toString() } as Property;
        updated = [newProp, ...current];
    }
    localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(updated));
    return updated;
};

export const deletePropertyWithImages = async (property: Property): Promise<boolean> => {
    const current = await getProperties();
    const updated = current.filter(p => p.id !== property.id);
    localStorage.setItem(STORAGE_KEYS.PROPERTIES, JSON.stringify(updated));
    return true;
};

// Clients
export const getClients = async (): Promise<Client[]> => {
    const stored = localStorage.getItem(STORAGE_KEYS.CLIENTS);
    return stored ? JSON.parse(stored) : [];
};

export const saveClient = async (client: Partial<Client>): Promise<Client[]> => {
    const current = await getClients();
    let updated = [];
    if (client.id) {
        updated = current.map(c => c.id === client.id ? { ...c, ...client } as Client : c);
    } else {
        const newClient = { ...client, id: Date.now().toString() } as Client;
        updated = [newClient, ...current];
    }
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(updated));
    return updated;
};

export const deleteClient = async (id: string): Promise<void> => {
    const current = await getClients();
    const updated = current.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(updated));
};

// Tasks
export const getTasks = async (): Promise<Task[]> => {
    const stored = localStorage.getItem(STORAGE_KEYS.TASKS);
    return stored ? JSON.parse(stored) : [];
};

export const saveTask = async (task: Partial<Task>): Promise<Task[]> => {
    const current = await getTasks();
    let updated = [];
    if (task.id) {
        updated = current.map(t => t.id === task.id ? { ...t, ...task } as Task : t);
    } else {
        const newTask = { ...task, id: Date.now().toString() } as Task;
        updated = [newTask, ...current];
    }
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
    return updated;
};

export const deleteTask = async (id: string): Promise<void> => {
    const current = await getTasks();
    const updated = current.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
};

// Commissions
export const getCommissions = async (): Promise<Commission[]> => {
    const stored = localStorage.getItem(STORAGE_KEYS.COMMISSIONS);
    return stored ? JSON.parse(stored) : [];
};

export const saveCommission = async (comm: Partial<Commission>): Promise<Commission[]> => {
    const current = await getCommissions();
    let updated = [];
    if (comm.id) {
        updated = current.map(c => c.id === comm.id ? { ...c, ...comm } as Commission : c);
    } else {
        const newComm = { ...comm, id: Date.now().toString() } as Commission;
        updated = [newComm, ...current];
    }
    localStorage.setItem(STORAGE_KEYS.COMMISSIONS, JSON.stringify(updated));
    return updated;
};

export const deleteCommission = async (id: string): Promise<void> => {
    const current = await getCommissions();
    const updated = current.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMMISSIONS, JSON.stringify(updated));
};

// Settings
export const getSystemSettings = async (): Promise<{ [key: string]: any }> => {
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return stored ? JSON.parse(stored) : {};
};

export const updateSystemSetting = async (key: string, value: any) => {
    const current = await getSystemSettings();
    const updated = { ...current, [key]: value };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    return true;
};

// --- User Management (Local Simulation) ---

export const getUsers = async (): Promise<User[]> => {
    const stored = localStorage.getItem(STORAGE_KEYS.USERS);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
    return MOCK_USERS;
};

export const saveUser = async (user: Partial<User>): Promise<User[]> => {
    const current = await getUsers();
    let updated = [];
    if (user.id) {
        updated = current.map(u => u.id === user.id ? { ...u, ...user } : u);
    } else {
        const newUser = { 
            ...user, 
            id: Date.now().toString(),
            lat: 0, lng: 0,
            last_seen: new Date().toLocaleString('fa-IR')
        } as User;
        updated = [...current, newUser];
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    return updated;
};

export const deleteUser = async (id: string): Promise<User[]> => {
    const current = await getUsers();
    const updated = current.filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
    return updated;
};

export const updateLiveLocation = async (userId: string, lat: number, lng: number) => {
    const current = await getUsers();
    const updated = current.map(u => 
        u.id === userId 
        ? { ...u, lat, lng, last_seen: new Date().toLocaleString('fa-IR') } 
        : u
    );
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));
};

export const fetchData = async () => {
    const [properties, clients, tasks, commissions] = await Promise.all([
        getProperties(),
        getClients(),
        getTasks(),
        getCommissions()
    ]);
    return { properties, clients, tasks, commissions };
};