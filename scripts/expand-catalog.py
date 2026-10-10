"""Build the bundled catalog from a local Vega movies JSON snapshot."""
import json,re,sys,pathlib
source=json.loads(pathlib.Path(sys.argv[1]).read_text())
root=pathlib.Path(__file__).resolve().parents[1]
genres={'Drama':'Dramma','Comedy':'Commedia','Action':'Azione','Adventure':'Avventura','Horror':'Horror','Thriller/Suspense':'Thriller','Romantic Comedy':'Romantico','Musical':'Musical','Documentary':'Documentario','Western':'Western','Concert/Performance':'Musical','Black Comedy':'Commedia'}
records=[];seen=set()
for i,m in enumerate(source):
 match=re.search(r'\b(\d{4})\b',m.get('Release Date') or '')
 if not match or not m.get('Title') or not m.get('Major Genre'): continue
 year=int(match[1]);title=str(m['Title']).strip()
 if year<1970 or (title.lower(),year) in seen:continue
 seen.add((title.lower(),year))
 records.append({'id':10000+i,'title':title,'originalTitle':title,'year':year,'genres':[genres.get(m['Major Genre'],m['Major Genre'])],'director':m.get('Director') or '', 'actors':[],'minutes':m.get('Running Time min') or None,'rating':m.get('IMDB Rating') or None,'ratingSource':'IMDb','description':'','poster':'','color':['#716652','#543f59','#42616b','#997064'][i%4],'providers':None,'source':'vega','votes':m.get('IMDB Votes') or 0})
records.sort(key=lambda m:-m['votes'])
(root/'dist/expanded-catalog.js').write_text('// Film metadata: Vega datasets movies.json (snapshot).\nconst expandedMovies='+json.dumps(records,ensure_ascii=False,separators=(',',':'))+';\n')
print('Expanded records:',len(records))
