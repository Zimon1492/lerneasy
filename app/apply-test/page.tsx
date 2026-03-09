// app/apply-test/page.tsx
export default function ApplyTest() {
  return (
    <main style={{minHeight:"100vh",display:"grid",placeItems:"center"}}>
      <form
        action="/api/teachers/apply"
        method="post"
        encType="multipart/form-data"
        style={{display:"grid",gap:8,width:360}}
      >
        <h1>Bewerbung Test</h1>
        <input name="name" placeholder="Name" required />
        <input type="email" name="email" placeholder="E-Mail" required />
        <input name="subject" placeholder="Fach (optional)" />
        <textarea name="letter" placeholder="Bewerbungstext" required rows={5} />
        <input type="file" name="file" accept="application/pdf" required />
        <button type="submit">Absenden</button>
      </form>
    </main>
  );
}
