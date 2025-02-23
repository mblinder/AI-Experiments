
import { XMLParser } from 'npm:fast-xml-parser';
import { ContentItem } from './types.ts';

export const createXmlParser = () => new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseAttributeValue: true,
  parseTagValue: true,
  trimValues: true,
  parseTrueNumberOnly: true,
  cdataTagName: '__cdata',
  cdataPositionChar: '\\c'
});

export const fetchRssFeed = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed ${url}: ${response.status}`);
  }
  return response.text();
};
