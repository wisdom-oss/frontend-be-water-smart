

export interface PhysicalMeter {
    address: {
        addressCountry: string;
        addressLocality: string;
        streetAddress: string;
    };
    category: string;
    date: string;
    description: string;
    id: string;
    type: string;
}

export interface AllPhysicalMeters {
    meters: PhysicalMeter[];
}

export interface VirtualMeter {
    dateCreated: string;
    description: string;
    id: string;
    submeterIds: string[];
    supermeterIds: string[];
}

export interface AllVirtualMeters {
    virtualMeters: VirtualMeter[];
}