export const varTemplate = (key: string, type: 'color' = 'color') => `--${type}-${key}`
export const toVars = (values: { [key: string]: string }) => {
    const newValues: any = {}
    for (const key in values) {
        newValues[key] = `var(${varTemplate(key)})`
    }
    return newValues
}
export const printVars = (vars: { [key: string]: string }, type: 'color' = 'color') => {
    let string = ''
    for (const key in vars) {
        string += `${varTemplate(key, type)}: ${vars[key]};\n`
    }
    return string
}

export const heightLvh = (value: number) => {
    return `
    height: ${value}vh;
    height: ${value}lvh;
    height: calc(var(--vh, 1lvh) * ${value});
    `
}
export const minHeightLvh = (value: number) => {
    return `
    min-height: ${value}vh;
    min-height: ${value}lvh;
    min-height: calc(var(--vh, 1lvh) * ${value});
    `
}
export const marginTopLvh = (value: number) => {
    return `
      margin-top: ${value}vh;
      margin-top: ${value}lvh;
      margin-top: calc(var(--vh, 1lvh) * ${value});
    `
}
export const marginBottomLvh = (value: number) => {
    return `
      margin-bottom: ${value}vh;
      margin-bottom: ${value}lvh;
      margin-bottom: calc(var(--vh, 1lvh) * ${value});
    `
}