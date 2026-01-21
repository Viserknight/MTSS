const AdSenseAd = () => {
  return (
    <div className="ad-container" style={{ textAlign: 'center', margin: '20px 0' }}>
      <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-layout="in-article"
           data-ad-format="fluid"
           data-ad-client="ca-pub-7882933738940013"
           data-ad-slot="8603166639">
      </ins>
      <script>
        (adsbygoogle = window.adsbygoogle || []).push({});
      </script>
    </div>
  );
};

export default AdSenseAd;