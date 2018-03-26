declare class AnwbResult{
    public roadEntries : AnwbRoadEntry[];
}
declare class AnwbRoadEntry{
    public road : string;
    public roadType : 'aWegen' | 'nWegen';
    public events : AnwbEvents;
}
declare class AnwbEvents{
    trafficJams : AnwbEvent[];
    roadWorks : AnwbEvent[];
    radars : AnwbEvent[];
}
declare class AnwbEvent{
    msgNr: string;
    fromLoc: {lat: number,long: number};
    from: string;
    to: string;
    distance: number;
    toLoc: {lat: number,long: number};
    location: string;
    segStart: string;
    segEnd: string;
    reason: string;
    description: string;
}