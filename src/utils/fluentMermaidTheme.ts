import { Theme } from '@fluentui/react-components';

export function applyFluentTheme(svgString: string, theme: Theme): string {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgString, "image/svg+xml");
    const svgElement = svgDoc.documentElement;

    // Style the SVG background
    svgElement.style.backgroundColor = theme.colorNeutralBackground1;

    // Style the nodes
    const rects = svgElement.getElementsByTagName('rect');
    for (let i = 0; i < rects.length; i++) {
        rects[i].style.fill = theme.colorBrandBackground;
        rects[i].style.stroke = theme.colorNeutralForeground1;
    }

    // Style the text
    const texts = svgElement.getElementsByTagName('text');
    for (let i = 0; i < texts.length; i++) {
        texts[i].style.fill = theme.colorNeutralForeground1;
        texts[i].style.fontFamily = theme.fontFamilyBase;
    }

    // Style the edges
    const paths = svgElement.getElementsByTagName('path');
    for (let i = 0; i < paths.length; i++) {
        paths[i].style.stroke = theme.colorNeutralForeground1;
    }

    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgElement);
}
