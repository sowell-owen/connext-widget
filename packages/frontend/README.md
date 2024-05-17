# Usage
Extract `frontend` folder to your application. Replace `path-to-extracted-folder` with an actual path.
```
import Widget from '/path-to-extracted-folder/src/components/Widget';

function App() {
  return (
    <div>
      <Widget />
    </div>
  );
}

```

- Redeploy contracts on desired chain ([here](https://github.com/sowell-owen/connext-widget/tree/main/packages/contracts#readme) you check how to deploy them)
- Update the constants accordingly (file `constants.ts`)
