export  class AnwbResult{
    public roadEntries : AnwbRoadEntry[];
}
export  class AnwbRoadEntry{
    public road : string;
    public roadType : 'aWegen' | 'nWegen';
    public events : AnwbEvents;
}
export  class AnwbEvents{
    trafficJams : AnwbEvent[];
    roadWorks : AnwbEvent[];
    radars : AnwbEvent[];
}
export  class AnwbEvent{
    msgNr: string;
    fromLoc: {lat: number,long: number};
    from: string;
    to: string;
    distance: number;
    delay: number;
    toLoc: {lat: number,long: number};
    location: string;
    segStart: string;
    segEnd: string;
    reason: string;
    description: string;
}