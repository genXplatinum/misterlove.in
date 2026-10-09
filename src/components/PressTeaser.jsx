import { Link } from 'react-router-dom';
import './PressTeaser.css';

export default function PressTeaser() {
  return <section className="press-home" aria-labelledby="press-home-title"><div className="container press-home__spread">
    <div className="press-home__copy"><p>Lovepreet Singh · Press & features</p><h2 id="press-home-title">Big ideas.<br />Bigger horizons.</h2><p>The vision. The ventures. The stories along the way. Step inside the press collection for Five Rivers Inc., Lovelace and their founder.</p><Link to="/press/">Step into the spotlight <span aria-hidden="true">↗</span></Link></div>
    <Link to="/press/" className="press-home__clippings" aria-label="Explore Lovepreet Singh’s press features"><img src="/press/clippings/dwi-medium.png" className="press-home__medium" alt="DWI Media News Network article about Lovepreet Singh on Medium" loading="lazy" width="1265" height="712" /><img src="/press/clippings/ein-presswire.jpg" className="press-home__ein" alt="EIN Presswire headline about Five Rivers Inc. and Lovelace" loading="lazy" width="1255" height="569" /><span>EIN Presswire · DWI Media Wire · YourStory · the clipping archive</span></Link>
  </div></section>;
}
