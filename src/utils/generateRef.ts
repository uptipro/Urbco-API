const generateRef = (val: any, length: number) => {
    let result = String(val).padStart(length, '0');
    return `URB-${result}`;
};

export default generateRef;
