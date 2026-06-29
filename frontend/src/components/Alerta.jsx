
const Alerta = ({ alerta }) => {
  return (
    <div
      className={`w-full mb-4 px-4 py-3 rounded-lg text-sm font-medium transition
        ${
          alerta.error
            ? 'bg-red-100 text-red-700 border border-red-300'
            : 'bg-green-100 text-green-700 border border-green-300'
        }
      `}
    >
      {alerta.msg}
    </div>
  );
};

export default Alerta;
