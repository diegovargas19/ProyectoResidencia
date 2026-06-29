import { useContext } from 'react';
import DepartamentosContext from '../context/DepartamentosProvider';

const useDepartamentos = () => {
  return useContext(DepartamentosContext);
};

export default useDepartamentos;
